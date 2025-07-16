import pool from './db.js';

const debugInventoryIssue = async () => {
    const client = await pool.connect();

    try {
        // Check if there are triggers on OrderItem table
        const triggerQuery = `
            SELECT 
                tgname as trigger_name,
                proname as function_name,
                tgenabled as enabled
            FROM pg_trigger t
            JOIN pg_proc p ON t.tgfoid = p.oid
            JOIN pg_class c ON t.tgrelid = c.oid
            WHERE c.relname = 'OrderItem';
        `;

        const triggers = await client.query(triggerQuery);
        console.log('Triggers on OrderItem table:', triggers.rows);

        // Check if delivery 24 exists
        const deliveryQuery = `
            SELECT d.delivery_id, d.order_id, o.status as order_status
            FROM "Delivery" d
            JOIN "Order" o ON d.order_id = o.order_id
            WHERE d.delivery_id = 24;
        `;

        const deliveryResult = await client.query(deliveryQuery);
        console.log('Delivery 24 info:', deliveryResult.rows);

        if (deliveryResult.rows.length > 0) {
            const orderId = deliveryResult.rows[0].order_id;

            // Check order items for this order
            const orderItemsQuery = `
                SELECT oi.product_id, oi.quantity, p.name
                FROM "OrderItem" oi
                JOIN "Product" p ON oi.product_id = p.product_id
                WHERE oi.order_id = $1;
            `;

            const orderItems = await client.query(orderItemsQuery, [orderId]);
            console.log('Order items:', orderItems.rows);

            // Check inventory for these products
            const inventoryQuery = `
                SELECT i.product_id, i.warehouse_id, i.quantity_in_stock, p.name
                FROM "Inventory" i
                JOIN "Product" p ON i.product_id = p.product_id
                WHERE i.product_id IN (
                    SELECT product_id FROM "OrderItem" WHERE order_id = $1
                );
            `;

            const inventory = await client.query(inventoryQuery, [orderId]);
            console.log('Current inventory:', inventory.rows);
        }

    } catch (error) {
        console.error('Debug error:', error);
    } finally {
        client.release();
    }

    process.exit(0);
};

debugInventoryIssue();
