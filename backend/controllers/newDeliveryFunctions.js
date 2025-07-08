import pool from '../db.js';

// Utility function to update order status in StatusHistory
const updateOrderStatusHistory = async (client, orderId, status, updatedBy = null) => {
    try {
        await client.query(
            `INSERT INTO "StatusHistory" (entity_type, entity_id, status, updated_by, notes) 
       VALUES ($1, $2, $3, $4, $5)`,
            ['order', orderId, status, updatedBy, null]
        );
        console.log(`Order ${orderId} status updated to: ${status}`);
    } catch (error) {
        console.error(`Error updating order status history:`, error);
        throw error;
    }
};

// Action 1: Products Fetched (Delivery boy has collected products from warehouse)
export const markProductsFetched = async (req, res) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { delivery_id } = req.params;
        const { delivery_boy_id } = req.body;

        console.log('markProductsFetched called with:', { delivery_id, delivery_boy_id });

        // Get order items for logging
        const orderItemsQuery = `
            SELECT oi.product_id, oi.quantity, p.name
            FROM "OrderItem" oi
            JOIN "Product" p ON oi.product_id = p.product_id
            WHERE oi.order_id = (
                SELECT order_id FROM "Delivery" WHERE delivery_id = $1
            )
        `;
        const orderItemsResult = await client.query(orderItemsQuery, [delivery_id]);
        console.log('Order items to be fetched:', orderItemsResult.rows);

        // Verify delivery exists and belongs to the delivery boy
        const deliveryQuery = `
      SELECT d.delivery_id, d.order_id, d.delivery_boy_id, d.actual_arrival, d.is_aborted
      FROM "Delivery" d
      WHERE d.delivery_id = $1 AND d.delivery_boy_id = $2
    `;

        const deliveryResult = await client.query(deliveryQuery, [delivery_id, delivery_boy_id]);

        if (deliveryResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                message: 'Delivery not found or not assigned to this delivery boy'
            });
        }

        const delivery = deliveryResult.rows[0];
        const orderId = delivery.order_id;

        if (delivery.is_aborted) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: 'Cannot update status for aborted delivery'
            });
        }

        // Update to "left_warehouse" status
        await updateOrderStatusHistory(client, orderId, 'left_warehouse', delivery_boy_id);

        // Decrease inventory quantities for all products in this order
        const inventoryUpdateQuery = `
            UPDATE "Inventory" i
            SET quantity_in_stock = i.quantity_in_stock - oi.quantity,
                last_restock_date = NOW()
            FROM "OrderItem" oi
            WHERE i.product_id = oi.product_id 
            AND oi.order_id = $1
            AND i.quantity_in_stock >= oi.quantity
        `;

        const inventoryResult = await client.query(inventoryUpdateQuery, [orderId]);
        console.log(`Updated inventory for ${inventoryResult.rowCount} products from order ${orderId}`);

        // Check if any products had insufficient inventory
        const insufficientInventoryQuery = `
            SELECT p.name, oi.quantity as ordered, i.quantity_in_stock as available
            FROM "OrderItem" oi
            JOIN "Product" p ON oi.product_id = p.product_id
            LEFT JOIN "Inventory" i ON oi.product_id = i.product_id
            WHERE oi.order_id = $1
            AND (i.quantity_in_stock IS NULL OR i.quantity_in_stock < oi.quantity)
        `;

        const insufficientResult = await client.query(insufficientInventoryQuery, [orderId]);

        if (insufficientResult.rows.length > 0) {
            await client.query('ROLLBACK');
            const insufficientProducts = insufficientResult.rows.map(row =>
                `${row.name} (ordered: ${row.ordered}, available: ${row.available || 0})`
            ).join(', ');

            return res.status(400).json({
                success: false,
                message: `Insufficient inventory for products: ${insufficientProducts}`
            });
        }

        await client.query('COMMIT');

        res.status(200).json({
            success: true,
            message: 'Products marked as fetched, inventory updated, delivery left warehouse'
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error marking products as fetched:', error);
        res.status(500).json({
            success: false,
            message: 'Error marking products as fetched',
            error: error.message
        });
    } finally {
        client.release();
    }
};

// Action 2: Delivery Completed (Customer received products)
export const markDeliveryCompletedNew = async (req, res) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { delivery_id } = req.params;
        const { delivery_boy_id } = req.body;

        console.log('markDeliveryCompletedNew called with:', { delivery_id, delivery_boy_id });

        // Verify delivery exists and belongs to the delivery boy
        const deliveryQuery = `
      SELECT d.delivery_id, d.order_id, d.delivery_boy_id, d.actual_arrival, d.is_aborted
      FROM "Delivery" d
      WHERE d.delivery_id = $1 AND d.delivery_boy_id = $2
    `;

        const deliveryResult = await client.query(deliveryQuery, [delivery_id, delivery_boy_id]);

        if (deliveryResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                message: 'Delivery not found or not assigned to this delivery boy'
            });
        }

        const delivery = deliveryResult.rows[0];
        const orderId = delivery.order_id;

        if (delivery.is_aborted) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: 'Cannot update status for aborted delivery'
            });
        }

        // Check current status - should be in_transit
        const currentStatusQuery = `
      SELECT status FROM "StatusHistory" 
      WHERE entity_type = 'order' AND entity_id = $1 
      ORDER BY updated_at DESC LIMIT 1
    `;
        const statusResult = await client.query(currentStatusQuery, [orderId]);
        const currentStatus = statusResult.rows[0]?.status || 'assigned';

        if (currentStatus !== 'in_transit') {
            // Auto-transition through required statuses if needed
            if (currentStatus === 'assigned') {
                await updateOrderStatusHistory(client, orderId, 'left_warehouse', delivery_boy_id);
            }
            if (currentStatus === 'assigned' || currentStatus === 'left_warehouse') {
                await updateOrderStatusHistory(client, orderId, 'in_transit', delivery_boy_id);
            }
        }

        // Update to "delivery_completed" status
        await updateOrderStatusHistory(client, orderId, 'delivery_completed', delivery_boy_id);

        // Update delivery table
        await client.query(
            'UPDATE "Delivery" SET actual_arrival = NOW(), updated_at = NOW() WHERE delivery_id = $1',
            [delivery_id]
        );

        // For cash on delivery, automatically transition to payment_received
        await updateOrderStatusHistory(client, orderId, 'payment_received', delivery_boy_id);

        await client.query('COMMIT');

        res.status(200).json({
            success: true,
            message: 'Delivery completed and payment received (cash on delivery)'
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error marking delivery as completed:', error);
        res.status(500).json({
            success: false,
            message: 'Error marking delivery as completed',
            error: error.message
        });
    } finally {
        client.release();
    }
};

// Action 3: Rate Customer (Available after payment received)
export const rateCustomer = async (req, res) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { delivery_id } = req.params;
        const { delivery_boy_id, rating, comment, was_customer_available, behavior } = req.body;

        console.log('rateCustomer called with:', {
            delivery_id,
            delivery_boy_id,
            rating,
            comment,
            was_customer_available,
            behavior
        });

        // Verify delivery exists and belongs to the delivery boy
        const deliveryQuery = `
      SELECT d.delivery_id, d.order_id, d.delivery_boy_id, o.user_id as customer_id, o.payment_status
      FROM "Delivery" d
      JOIN "Order" o ON d.order_id = o.order_id
      WHERE d.delivery_id = $1 AND d.delivery_boy_id = $2
    `;

        const deliveryResult = await client.query(deliveryQuery, [delivery_id, delivery_boy_id]);

        if (deliveryResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                message: 'Delivery not found or not assigned to this delivery boy'
            });
        }

        const delivery = deliveryResult.rows[0];
        const orderId = delivery.order_id;
        const customerId = delivery.customer_id;

        // Check if payment has been received (should be automatic after delivery completion)
        const currentStatusQuery = `
      SELECT status FROM "StatusHistory" 
      WHERE entity_type = 'order' AND entity_id = $1 
      ORDER BY updated_at DESC LIMIT 1
    `;
        const statusResult = await client.query(currentStatusQuery, [orderId]);
        const currentStatus = statusResult.rows[0]?.status;

        // For cash on delivery, payment should be received automatically after delivery completion
        if (currentStatus === 'delivery_completed') {
            // Auto-transition to payment_received for cash on delivery
            await updateOrderStatusHistory(client, orderId, 'payment_received', delivery_boy_id);
        } else if (currentStatus !== 'payment_received') {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: 'Cannot rate customer until delivery is completed and payment is received'
            });
        }

        // Validate rating
        if (!rating || rating < 1 || rating > 5) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 1 and 5'
            });
        }

        // Check if review already exists
        const existingReviewQuery = `
      SELECT review_id FROM "DeliveryReview" 
      WHERE delivery_id = $1 AND delivery_boy_id = $2
    `;
        const existingResult = await client.query(existingReviewQuery, [delivery_id, delivery_boy_id]);

        if (existingResult.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: 'Customer has already been rated for this delivery'
            });
        }

        // Insert delivery review
        await client.query(
            `INSERT INTO "DeliveryReview" 
       (delivery_id, delivery_boy_id, customer_id, rating, comment, was_customer_available, behavior)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [delivery_id, delivery_boy_id, customerId, rating, comment, was_customer_available, behavior]
        );

        await client.query('COMMIT');

        res.status(200).json({
            success: true,
            message: 'Customer rating submitted successfully. Delivery workflow completed and removed from dashboard.'
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error rating customer:', error);
        res.status(500).json({
            success: false,
            message: 'Error rating customer',
            error: error.message
        });
    } finally {
        client.release();
    }
};

// Utility function to fix deliveries without proper status history
export const fixDeliveryStatusHistory = async (req, res) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Find deliveries that have been assigned to delivery boys but don't have 'assigned' status
        const findDeliveriesQuery = `
            SELECT DISTINCT d.delivery_id, d.order_id, d.delivery_boy_id
            FROM "Delivery" d
            WHERE d.delivery_boy_id IS NOT NULL
            AND d.is_aborted = false
            AND NOT EXISTS (
                SELECT 1 FROM "StatusHistory" sh 
                WHERE sh.entity_type = 'order' 
                AND sh.entity_id = d.order_id 
                AND sh.status IN ('assigned', 'left_warehouse', 'in_transit', 'delivery_completed', 'payment_received')
            )
        `;

        const deliveriesResult = await client.query(findDeliveriesQuery);

        if (deliveriesResult.rows.length === 0) {
            await client.query('COMMIT');
            return res.status(200).json({
                success: true,
                message: 'No deliveries need status history fixes',
                fixed_count: 0
            });
        }

        // Fix each delivery by adding 'assigned' status
        for (const delivery of deliveriesResult.rows) {
            await updateOrderStatusHistory(
                client,
                delivery.order_id,
                'assigned',
                delivery.delivery_boy_id
            );
        }

        await client.query('COMMIT');

        res.status(200).json({
            success: true,
            message: `Fixed status history for ${deliveriesResult.rows.length} deliveries`,
            fixed_count: deliveriesResult.rows.length,
            fixed_deliveries: deliveriesResult.rows.map(d => ({
                delivery_id: d.delivery_id,
                order_id: d.order_id
            }))
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error fixing delivery status history:', error);
        res.status(500).json({
            success: false,
            message: 'Error fixing delivery status history',
            error: error.message
        });
    } finally {
        client.release();
    }
};

// Debug function to check all deliveries in the system
export const debugDeliveries = async (req, res) => {
    const client = await pool.connect();

    try {
        // Get all deliveries
        const deliveriesQuery = `
            SELECT 
                d.delivery_id,
                d.order_id,
                d.delivery_boy_id,
                d.is_aborted,
                o.user_id as customer_id,
                sh.status as current_status
            FROM "Delivery" d
            JOIN "Order" o ON d.order_id = o.order_id
            LEFT JOIN LATERAL (
                SELECT status 
                FROM "StatusHistory" 
                WHERE entity_type = 'order' AND entity_id = o.order_id 
                ORDER BY updated_at DESC LIMIT 1
            ) sh ON true
            ORDER BY d.delivery_id DESC
            LIMIT 10
        `;

        const result = await client.query(deliveriesQuery);

        res.status(200).json({
            success: true,
            message: 'Debug info for deliveries',
            data: result.rows,
            count: result.rows.length
        });

    } catch (error) {
        console.error('Error in debug deliveries:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting debug info',
            error: error.message
        });
    } finally {
        client.release();
    }
};

// Fix specific delivery status from pending to assigned
export const updatePendingDeliveriesToAssigned = async (req, res) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Find deliveries with pending status that should be assigned
        const findPendingQuery = `
            SELECT DISTINCT d.delivery_id, d.order_id, d.delivery_boy_id
            FROM "Delivery" d
            JOIN "StatusHistory" sh ON sh.entity_type = 'order' AND sh.entity_id = d.order_id
            WHERE d.delivery_boy_id IS NOT NULL
            AND d.is_aborted = false
            AND sh.status = 'pending'
            AND sh.updated_at = (
                SELECT MAX(sh2.updated_at) 
                FROM "StatusHistory" sh2 
                WHERE sh2.entity_type = 'order' AND sh2.entity_id = d.order_id
            )
        `;

        const pendingResult = await client.query(findPendingQuery);

        if (pendingResult.rows.length === 0) {
            await client.query('COMMIT');
            return res.status(200).json({
                success: true,
                message: 'No pending deliveries to update',
                updated_count: 0
            });
        }

        // Update each pending delivery to assigned
        for (const delivery of pendingResult.rows) {
            await updateOrderStatusHistory(
                client,
                delivery.order_id,
                'assigned',
                delivery.delivery_boy_id
            );
        }

        await client.query('COMMIT');

        res.status(200).json({
            success: true,
            message: `Updated ${pendingResult.rows.length} deliveries from pending to assigned`,
            updated_count: pendingResult.rows.length,
            updated_deliveries: pendingResult.rows.map(d => ({
                delivery_id: d.delivery_id,
                order_id: d.order_id
            }))
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating pending deliveries:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating pending deliveries',
            error: error.message
        });
    } finally {
        client.release();
    }
};

// Manually update a specific delivery to assigned status
export const updateDeliveryToAssigned = async (req, res) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { order_id, delivery_boy_id } = req.body;

        if (!order_id || !delivery_boy_id) {
            return res.status(400).json({
                success: false,
                message: 'order_id and delivery_boy_id are required'
            });
        }

        // Update the order status to assigned
        await updateOrderStatusHistory(
            client,
            order_id,
            'assigned',
            delivery_boy_id
        );

        await client.query('COMMIT');

        res.status(200).json({
            success: true,
            message: `Updated order ${order_id} to assigned status`,
            order_id: order_id,
            delivery_boy_id: delivery_boy_id
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating delivery to assigned:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating delivery to assigned',
            error: error.message
        });
    } finally {
        client.release();
    }
};
