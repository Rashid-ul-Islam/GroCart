import db from '../db.js';

// Get pending product fetch approvals (using Orders with special status)
export const getPendingProductApprovals = async (req, res) => {
    try {
        // We'll use orders with payment_status = 'fetch_pending' to represent delivery boy fetch requests
        const query = `
      SELECT 
        o.order_id,
        o.user_id as delivery_boy_id,
        oi.product_id,
        oi.quantity,
        o.created_at as request_date,
        o.payment_status as status,
        p.name as product_name,
        p.price,
        p.category_id,
        u.first_name,
        u.last_name,
        u.email,
        u.phone_number,
        c.name as category_name
      FROM "Order" o
      JOIN "OrderItem" oi ON o.order_id = oi.order_id
      JOIN "Product" p ON oi.product_id = p.product_id
      JOIN "User" u ON o.user_id = u.user_id
      LEFT JOIN "Category" c ON p.category_id = c.category_id
      WHERE o.payment_status = 'fetch_pending'
      ORDER BY o.created_at DESC
    `;

        const result = await db.query(query);

        const approvals = result.rows.map(row => ({
            orderId: row.order_id,
            deliveryId: row.delivery_boy_id,
            productId: row.product_id,
            productName: row.product_name,
            price: row.price,
            categoryId: row.category_id,
            categoryName: row.category_name,
            quantity: row.quantity,
            requestDate: row.request_date,
            status: row.status,
            deliveryBoyName: `${row.first_name || ''} ${row.last_name || ''}`.trim(),
            deliveryBoyEmail: row.email,
            deliveryBoyPhone: row.phone_number
        }));

        res.json(approvals);
    } catch (error) {
        console.error('Error fetching product approvals:', error);
        res.status(500).json({ error: 'Failed to fetch product approvals' });
    }
};

// Get pending warehouse transfer approvals (using special order status)
export const getPendingWarehouseTransfers = async (req, res) => {
    try {
        // We'll use orders with payment_status = 'transfer_pending' to represent warehouse transfer requests
        const query = `
      SELECT 
        o.order_id as transfer_id,
        oi.product_id,
        oi.quantity,
        o.created_at as request_date,
        o.payment_status as status,
        p.name as product_name,
        p.price,
        p.category_id,
        c.name as category_name,
        -- We'll use order comments/notes to store warehouse info
        -- For now, we'll simulate this with warehouses from inventory
        w1.name as from_warehouse,
        w1.location as from_location,
        w2.name as to_warehouse,
        w2.location as to_location,
        w1.warehouse_id as from_warehouse_id,
        w2.warehouse_id as to_warehouse_id
      FROM "Order" o
      JOIN "OrderItem" oi ON o.order_id = oi.order_id
      JOIN "Product" p ON oi.product_id = p.product_id
      LEFT JOIN "Category" c ON p.category_id = c.category_id
      CROSS JOIN "Warehouse" w1
      CROSS JOIN "Warehouse" w2
      WHERE o.payment_status = 'transfer_pending'
      AND w1.warehouse_id != w2.warehouse_id
      AND w1.warehouse_id = 1 -- From main warehouse
      AND w2.warehouse_id = 2 -- To secondary warehouse
      ORDER BY o.created_at DESC
      LIMIT 10
    `;

        const result = await db.query(query);

        const transfers = result.rows.map(row => ({
            transferId: row.transfer_id,
            productId: row.product_id,
            productName: row.product_name,
            price: row.price,
            categoryId: row.category_id,
            categoryName: row.category_name,
            fromWarehouseId: row.from_warehouse_id,
            toWarehouseId: row.to_warehouse_id,
            fromWarehouse: row.from_warehouse,
            fromLocation: row.from_location,
            toWarehouse: row.to_warehouse,
            toLocation: row.to_location,
            quantity: row.quantity,
            requestDate: row.request_date,
            status: row.status
        }));

        res.json(transfers);
    } catch (error) {
        console.error('Error fetching warehouse transfers:', error);
        res.status(500).json({ error: 'Failed to fetch warehouse transfers' });
    }
};

// Approve/Reject product fetch request
export const approveProductFetch = async (req, res) => {
    const { deliveryId, productId } = req.params;
    const { action } = req.body; // 'approve' or 'reject'

    try {
        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({ error: 'Invalid action. Must be approve or reject' });
        }

        // Start transaction
        await db.query('BEGIN');

        try {
            // Find the pending fetch request (order with fetch_pending status)
            const findOrderQuery = `
                SELECT o.order_id, oi.quantity, oi.product_id
                FROM "Order" o
                JOIN "OrderItem" oi ON o.order_id = oi.order_id
                WHERE o.user_id = $1 AND oi.product_id = $2 AND o.payment_status = 'fetch_pending'
                LIMIT 1
            `;

            const orderResult = await db.query(findOrderQuery, [deliveryId, productId]);

            if (orderResult.rows.length === 0) {
                await db.query('ROLLBACK');
                return res.status(404).json({ error: 'Product fetch request not found' });
            }

            const order = orderResult.rows[0];

            if (action === 'approve') {
                // Update inventory - reduce quantity from main warehouse
                const updateInventoryQuery = `
                    UPDATE "Inventory" 
                    SET quantity_in_stock = quantity_in_stock - $1,
                        last_restock_date = CURRENT_TIMESTAMP
                    WHERE product_id = $2 AND warehouse_id = 1
                    AND quantity_in_stock >= $1
                `;

                const inventoryResult = await db.query(updateInventoryQuery, [order.quantity, productId]);

                if (inventoryResult.rowCount === 0) {
                    await db.query('ROLLBACK');
                    return res.status(400).json({ error: 'Insufficient inventory or product not found in warehouse' });
                }

                // Update order status to approved
                await db.query(`
                    UPDATE "Order" 
                    SET payment_status = 'fetch_approved', updated_at = CURRENT_TIMESTAMP
                    WHERE order_id = $1
                `, [order.order_id]);

                // Update product availability if quantity becomes 0
                await db.query(`
                    UPDATE "Product" 
                    SET is_available = CASE 
                        WHEN (SELECT SUM(quantity_in_stock) FROM "Inventory" WHERE product_id = $1) = 0 
                        THEN false 
                        ELSE true 
                    END,
                    updated_at = CURRENT_TIMESTAMP
                    WHERE product_id = $1
                `, [productId]);

            } else {
                // Update order status to rejected
                await db.query(`
                    UPDATE "Order" 
                    SET payment_status = 'fetch_rejected', updated_at = CURRENT_TIMESTAMP
                    WHERE order_id = $1
                `, [order.order_id]);
            }

            await db.query('COMMIT');

            res.json({
                message: `Product fetch request ${action}d successfully`,
                orderId: order.order_id,
                productId: productId,
                quantity: order.quantity
            });

        } catch (innerError) {
            await db.query('ROLLBACK');
            throw innerError;
        }

    } catch (error) {
        console.error(`Error ${action}ing product fetch:`, error);
        res.status(500).json({ error: `Failed to ${action} product fetch request` });
    }
};

// Approve/Reject warehouse transfer request
export const approveWarehouseTransfer = async (req, res) => {
    const { transferId } = req.params;
    const { action } = req.body; // 'approve' or 'reject'

    try {
        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({ error: 'Invalid action. Must be approve or reject' });
        }

        // Start transaction
        await db.query('BEGIN');

        try {
            // Find the pending transfer request (order with transfer_pending status)
            const findOrderQuery = `
                SELECT o.order_id, oi.quantity, oi.product_id
                FROM "Order" o
                JOIN "OrderItem" oi ON o.order_id = oi.order_id
                WHERE o.order_id = $1 AND o.payment_status = 'transfer_pending'
                LIMIT 1
            `;

            const orderResult = await db.query(findOrderQuery, [transferId]);

            if (orderResult.rows.length === 0) {
                await db.query('ROLLBACK');
                return res.status(404).json({ error: 'Warehouse transfer request not found' });
            }

            const order = orderResult.rows[0];

            if (action === 'approve') {
                // Default source warehouse (main warehouse)
                const fromWarehouseId = 1;
                // Default destination warehouse (secondary warehouse)
                const toWarehouseId = 2;

                // Check if source warehouse has enough quantity
                const checkInventoryQuery = `
                    SELECT quantity_in_stock 
                    FROM "Inventory" 
                    WHERE warehouse_id = $1 AND product_id = $2
                `;

                const inventoryCheck = await db.query(checkInventoryQuery, [fromWarehouseId, order.product_id]);

                if (inventoryCheck.rows.length === 0 || inventoryCheck.rows[0].quantity_in_stock < order.quantity) {
                    await db.query('ROLLBACK');
                    return res.status(400).json({ error: 'Insufficient inventory in source warehouse' });
                }

                // Decrease quantity in source warehouse
                await db.query(`
                    UPDATE "Inventory" 
                    SET quantity_in_stock = quantity_in_stock - $1,
                        last_restock_date = CURRENT_TIMESTAMP
                    WHERE warehouse_id = $2 AND product_id = $3
                `, [order.quantity, fromWarehouseId, order.product_id]);

                // Increase quantity in destination warehouse (or create new record)
                await db.query(`
                    INSERT INTO "Inventory" (warehouse_id, product_id, quantity_in_stock, last_restock_date)
                    VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
                    ON CONFLICT (product_id, warehouse_id)
                    DO UPDATE SET 
                        quantity_in_stock = "Inventory".quantity_in_stock + $3,
                        last_restock_date = CURRENT_TIMESTAMP
                `, [toWarehouseId, order.product_id, order.quantity]);

                // Update order status to approved
                await db.query(`
                    UPDATE "Order" 
                    SET payment_status = 'transfer_approved', updated_at = CURRENT_TIMESTAMP
                    WHERE order_id = $1
                `, [order.order_id]);

            } else {
                // Update order status to rejected
                await db.query(`
                    UPDATE "Order" 
                    SET payment_status = 'transfer_rejected', updated_at = CURRENT_TIMESTAMP
                    WHERE order_id = $1
                `, [order.order_id]);
            }

            await db.query('COMMIT');

            res.json({
                message: `Warehouse transfer ${action}d successfully`,
                orderId: order.order_id,
                productId: order.product_id,
                quantity: order.quantity
            });

        } catch (innerError) {
            await db.query('ROLLBACK');
            throw innerError;
        }

    } catch (error) {
        console.error(`Error ${action}ing warehouse transfer:`, error);
        res.status(500).json({ error: `Failed to ${action} warehouse transfer` });
    }
};
