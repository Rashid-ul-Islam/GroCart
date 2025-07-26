import pool from './db.js';

async function testStatsAPI() {
    try {
        console.log('Testing database connection and stats API...');
        
        // Check if there are any orders
        const orderCount = await pool.query('SELECT COUNT(*) FROM "Order"');
        console.log('Total orders in database:', orderCount.rows[0].count);
        
        // Check if there are any completed orders
        const completedOrders = await pool.query('SELECT COUNT(*) FROM "Order" WHERE payment_status = \'completed\'');
        console.log('Completed orders:', completedOrders.rows[0].count);
        
        // Test the revenue data query directly
        const revenueQuery = `
            SELECT 
                DATE(o.order_date) as date,
                COALESCE(SUM(o.total_amount), 0) as revenue,
                COUNT(o.order_id) as orders,
                COUNT(DISTINCT o.user_id) as customers
            FROM "Order" o
            WHERE o.payment_status = 'completed' 
            AND o.order_date >= CURRENT_DATE - INTERVAL '7 days'
            GROUP BY DATE(o.order_date)
            ORDER BY DATE(o.order_date)
        `;
        
        const revenueResult = await pool.query(revenueQuery);
        console.log('Revenue data result:', revenueResult.rows);
        
        // If no data, let's add some sample data
        if (revenueResult.rows.length === 0) {
            console.log('\nNo revenue data found. Adding sample data...');
            await addSampleData();
            
            // Test again
            const newRevenueResult = await pool.query(revenueQuery);
            console.log('New revenue data result:', newRevenueResult.rows);
        }
        
    } catch (error) {
        console.error('Error testing stats API:', error);
    } finally {
        await pool.end();
    }
}

async function addSampleData() {
    try {
        // Add sample users
        const userInsert = `
            INSERT INTO "User" (username, email, password_hash, first_name, last_name, phone_number, created_at)
            VALUES 
            ('testuser1', 'test1@example.com', 'hash123', 'John', 'Doe', '1234567890', NOW() - INTERVAL '5 days'),
            ('testuser2', 'test2@example.com', 'hash123', 'Jane', 'Smith', '1234567891', NOW() - INTERVAL '3 days')
            ON CONFLICT (username) DO NOTHING
            RETURNING user_id
        `;
        
        // Add sample categories
        const categoryInsert = `
            INSERT INTO "Category" (name, description, created_at)
            VALUES 
            ('Electronics', 'Electronic devices and accessories', NOW()),
            ('Fashion', 'Clothing and accessories', NOW())
            ON CONFLICT DO NOTHING
        `;
        
        await pool.query(categoryInsert);
        
        // Get or create category IDs
        const categories = await pool.query('SELECT category_id, name FROM "Category" LIMIT 2');
        const electronicsCatId = categories.rows.find(c => c.name === 'Electronics')?.category_id;
        const fashionCatId = categories.rows.find(c => c.name === 'Fashion')?.category_id;
        
        if (!electronicsCatId || !fashionCatId) {
            console.log('Failed to get category IDs');
            return;
        }
        
        // Add sample products
        const productInsert = `
            INSERT INTO "Product" (name, category_id, price, quantity, unit_measure, description, is_refundable, is_available, created_at)
            VALUES 
            ('iPhone 15', $1, 1200.00, 50, 'piece', 'Latest iPhone model', true, true, NOW()),
            ('Samsung Galaxy S24', $2, 1000.00, 30, 'piece', 'Latest Samsung model', true, true, NOW()),
            ('Nike T-Shirt', $3, 25.00, 100, 'piece', 'Comfortable cotton t-shirt', true, true, NOW())
            ON CONFLICT DO NOTHING
            RETURNING product_id
        `;
        
        await pool.query(productInsert, [electronicsCatId, electronicsCatId, fashionCatId]);
        
        // Get product IDs
        const products = await pool.query('SELECT product_id, name FROM "Product" LIMIT 3');
        const iphoneId = products.rows.find(p => p.name === 'iPhone 15')?.product_id;
        const samsungId = products.rows.find(p => p.name === 'Samsung Galaxy S24')?.product_id;
        const tshirtId = products.rows.find(p => p.name === 'Nike T-Shirt')?.product_id;
        
        if (!iphoneId || !samsungId || !tshirtId) {
            console.log('Failed to get product IDs');
            return;
        }
        
        // Get user IDs
        const users = await pool.query('SELECT user_id FROM "User" LIMIT 2');
        if (users.rows.length < 2) {
            console.log('Failed to get user IDs');
            return;
        }
        
        const user1Id = users.rows[0].user_id;
        const user2Id = users.rows[1].user_id;
        
        // Add sample orders with recent dates
        const orderInsert = `
            INSERT INTO "Order" (user_id, order_date, total_amount, product_total, tax_total, shipping_total, discount_total, payment_method, payment_status, created_at)
            VALUES 
            ($1, NOW() - INTERVAL '1 day', 1225.00, 1200.00, 20.00, 5.00, 0.00, 'card', 'completed', NOW() - INTERVAL '1 day'),
            ($2, NOW() - INTERVAL '2 days', 1025.00, 1000.00, 20.00, 5.00, 0.00, 'card', 'completed', NOW() - INTERVAL '2 days'),
            ($1, NOW() - INTERVAL '3 days', 30.00, 25.00, 3.00, 2.00, 0.00, 'card', 'completed', NOW() - INTERVAL '3 days'),
            ($2, NOW() - INTERVAL '4 days', 1225.00, 1200.00, 20.00, 5.00, 0.00, 'card', 'completed', NOW() - INTERVAL '4 days'),
            ($1, NOW() - INTERVAL '5 days', 1025.00, 1000.00, 20.00, 5.00, 0.00, 'card', 'completed', NOW() - INTERVAL '5 days')
            RETURNING order_id
        `;
        
        const orderResult = await pool.query(orderInsert, [user1Id, user2Id]);
        console.log('Sample orders created:', orderResult.rows.length);
        
        // Add order items for the orders
        const orderIds = orderResult.rows.map(r => r.order_id);
        
        for (let i = 0; i < orderIds.length; i++) {
            const orderId = orderIds[i];
            const productId = i % 2 === 0 ? iphoneId : (i % 3 === 1 ? samsungId : tshirtId);
            const price = i % 2 === 0 ? 1200.00 : (i % 3 === 1 ? 1000.00 : 25.00);
            
            await pool.query(
                'INSERT INTO "OrderItem" (order_id, product_id, quantity, price) VALUES ($1, $2, 1, $3)',
                [orderId, productId, price]
            );
        }
        
        console.log('Sample data added successfully!');
        
    } catch (error) {
        console.error('Error adding sample data:', error);
    }
}

testStatsAPI();
