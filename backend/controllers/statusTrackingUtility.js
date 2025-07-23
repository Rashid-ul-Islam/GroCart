import pool from '../db.js';

/**
 * Consolidated status tracking utility
 * Handles status updates for both orders and deliveries using unified StatusHistory table
 */

// Update order status with consolidated tracking
export const updateOrderStatus = async (orderId, newStatus, updatepooly = null, notes = null, existingClient = null) => {
    const client = existingClient || await pool.connect();
    const shouldManageTransaction = !existingClient;

    try {
        if (shouldManageTransaction) {
            await client.query('BEGIN');
        }

        // Update order current status (if current_status column exists)
        // First check if the column exists
        const columnCheckQuery = `
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'Order' AND column_name = 'current_status'
        `;
        const columnResult = await client.query(columnCheckQuery);

        if (columnResult.rows.length > 0) {
            // Column exists, so update it
            await client.query(
                'UPDATE "Order" SET current_status = $1, updated_at = NOW() WHERE order_id = $2',
                [newStatus, orderId]
            );
        }

        // Insert status tracking record using consolidated StatusHistory table
        await client.query(
            'INSERT INTO "StatusHistory" (entity_type, entity_id, status, updated_by, notes) VALUES ($1, $2, $3, $4, $5)',
            ['order', orderId, newStatus, updatepooly, notes]
        );

        if (shouldManageTransaction) {
            await client.query('COMMIT');
        }
        return true;
    } catch (error) {
        if (shouldManageTransaction) {
            await client.query('ROLLBACK');
        }
        throw error;
    } finally {
        if (shouldManageTransaction) {
            client.release();
        }
    }
};

// Update delivery status with consolidated tracking
export const updateDeliveryStatus = async (deliveryId, newStatus, updatepooly, notes = null, existingClient = null) => {
    const client = existingClient || await pool.connect();
    const shouldManageTransaction = !existingClient;

    try {
        if (shouldManageTransaction) {
            await client.query('BEGIN');
        }

        // Update delivery current status (if current_status column exists)
        // First check if the column exists
        const columnCheckQuery = `
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'Delivery' AND column_name = 'current_status'
        `;
        const columnResult = await client.query(columnCheckQuery);

        if (columnResult.rows.length > 0) {
            // Column exists, so update it
            await client.query(
                'UPDATE "Delivery" SET current_status = $1, updated_at = NOW() WHERE delivery_id = $2',
                [newStatus, deliveryId]
            );
        }

        // Insert status tracking record using consolidated StatusHistory table
        await client.query(
            'INSERT INTO "StatusHistory" (entity_type, entity_id, status, updated_by, notes) VALUES ($1, $2, $3, $4, $5)',
            ['delivery', deliveryId, newStatus, updatepooly, notes]
        );

        if (shouldManageTransaction) {
            await client.query('COMMIT');
        }
        return true;
    } catch (error) {
        if (shouldManageTransaction) {
            await client.query('ROLLBACK');
        }
        throw error;
    } finally {
        if (shouldManageTransaction) {
            client.release();
        }
    }
};

// Get status history for an entity (order or delivery)
export const getStatusHistory = async (entityType, entityId) => {
    try {
        let actualEntityId = entityId;

        // Handle order identifier format conversion
        if (entityType === 'order' && typeof entityId === 'string' && entityId.startsWith('ORD-')) {
            // Extract the numeric part and query the Order table to get the actual order_id
            const orderQuery = `
                SELECT order_id 
                FROM "Order" 
                WHERE order_id = $1 OR CONCAT('ORD-', LPAD(order_id::text, 6, '0')) = $2
            `;

            const orderResult = await pool.query(orderQuery, [parseInt(entityId.replace('ORD-', '')), entityId]);

            if (orderResult.rows.length === 0) {
                throw new Error(`Order not found with identifier: ${entityId}`);
            }

            actualEntityId = orderResult.rows[0].order_id;
        }

        // Ensure entityId is an integer for database query
        const numericEntityId = parseInt(actualEntityId);
        if (isNaN(numericEntityId)) {
            throw new Error(`Invalid entity ID format: ${entityId}`);
        }

        const query = `
            SELECT 
                sh.status,
                sh.updated_at,
                sh.notes,
                u.first_name,
                u.last_name,
                u.username
            FROM "StatusHistory" sh
            LEFT JOIN "User" u ON sh.updated_by = u.user_id
            WHERE sh.entity_type = $1 AND sh.entity_id = $2
            ORDER BY sh.updated_at DESC
        `;

        const result = await pool.query(query, [entityType, numericEntityId]);
        console.log(`Fetched ${result.rows.length} status history records for ${entityType} ID: ${numericEntityId}`);
        console.log(result.rows);
        return result.rows;
    } catch (error) {
        console.error(`Error fetching ${entityType} status history:`, error);
        throw error;
    }
};

// Get current status for an entity
export const getCurrentStatus = async (entityType, entityId) => {
    try {
        let actualEntityId = entityId;

        // Handle order identifier format conversion
        if (entityType === 'order' && typeof entityId === 'string' && entityId.startsWith('ORD-')) {
            // Extract the numeric part and query the Order table to get the actual order_id
            const orderQuery = `
                SELECT order_id 
                FROM "Order" 
                WHERE order_id = $1 OR CONCAT('ORD-', LPAD(order_id::text, 6, '0')) = $2
            `;

            const orderResult = await pool.query(orderQuery, [parseInt(entityId.replace('ORD-', '')), entityId]);

            if (orderResult.rows.length === 0) {
                throw new Error(`Order not found with identifier: ${entityId}`);
            }

            actualEntityId = orderResult.rows[0].order_id;
        }

        // Ensure entityId is an integer for database query
        const numericEntityId = parseInt(actualEntityId);
        if (isNaN(numericEntityId)) {
            throw new Error(`Invalid entity ID format: ${entityId}`);
        }

        const query = `
            SELECT status, updated_at
            FROM "StatusHistory"
            WHERE entity_type = $1 AND entity_id = $2
            ORDER BY updated_at DESC
            LIMIT 1
        `;

        const result = await pool.query(query, [entityType, numericEntityId]);
        return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
        console.error(`Error fetching current ${entityType} status:`, error);
        throw error;
    }
};

// Migration helper: Convert existing OrderStatusHistory to consolidated StatusHistory
export const migrateOrderStatusHistory = async () => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Check if old OrderStatusHistory table exists
        const tableExistsQuery = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'OrderStatusHistory'
      );
    `);

        if (tableExistsQuery.rows[0].exists) {
            // Migrate data from OrderStatusHistory to StatusHistory
            await client.query(`
        INSERT INTO "StatusHistory" (entity_type, entity_id, status, updated_at, updated_by)
        SELECT 'order', order_id, status, updated_at, updated_by 
        FROM "OrderStatusHistory"
        ON CONFLICT DO NOTHING
      `);

            console.log('OrderStatusHistory data migrated to StatusHistory');

            // Optional: Drop the old table (uncomment if you want to remove it)
            // await client.query('DROP TABLE "OrderStatusHistory"');
            // console.log('OrderStatusHistory table dropped');
        }

        await client.query('COMMIT');
        return true;
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', error);
        throw error;
    } finally {
        client.release();
    }
};
