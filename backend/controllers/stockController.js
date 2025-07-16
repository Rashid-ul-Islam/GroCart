import db from '../db.js';

// Check stock availability for cart items (only check, don't reserve)
export const checkStockAvailability = async (req, res) => {
    try {
        const { items } = req.body; // Array of {product_id, quantity}

        if (!items || !Array.isArray(items)) {
            return res.status(400).json({
                success: false,
                message: 'Items array is required'
            });
        }

        const stockResults = [];
        const unavailableItems = [];

        // Check all items for availability
        for (const item of items) {
            const { product_id, quantity } = item;

            // Get current stock information
            const stockQuery = `
                SELECT 
                    p.product_id,
                    p.name,
                    p.total_available_stock,
                    p.buying_in_progress,
                    (p.total_available_stock - p.buying_in_progress) as available_now
                FROM "Product" p
                WHERE p.product_id = $1
            `;

            const stockResult = await db.query(stockQuery, [product_id]);

            if (stockResult.rows.length === 0) {
                unavailableItems.push({
                    product_id,
                    name: 'Unknown Product',
                    requested: quantity,
                    available: 0,
                    reason: 'Product not found'
                });
                continue;
            }

            const product = stockResult.rows[0];
            const availableNow = product.available_now;

            stockResults.push({
                product_id: product.product_id,
                name: product.name,
                total_stock: product.total_available_stock,
                buying_in_progress: product.buying_in_progress,
                available_now: availableNow,
                requested: quantity,
                can_fulfill: availableNow >= quantity
            });

            // If not enough stock available
            if (availableNow < quantity) {
                unavailableItems.push({
                    product_id: product.product_id,
                    name: product.name,
                    requested: quantity,
                    available: Math.max(0, availableNow),
                    reason: availableNow <= 0 ?
                        'Other users are currently purchasing this item' :
                        'Insufficient stock available'
                });
            }
        }

        res.json({
            success: true,
            data: {
                all_available: unavailableItems.length === 0,
                stock_details: stockResults,
                unavailable_items: unavailableItems
            }
        });

    } catch (error) {
        console.error('Error checking stock availability:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check stock availability',
            error: error.message
        });
    }
};

// Reserve stock for items (mark as buying_in_progress)
export const reserveStock = async (req, res) => {
    const client = await db.connect();
    
    try {
        await client.query('BEGIN');
        
        const { items } = req.body;

        if (!items || !Array.isArray(items)) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: 'Items array is required'
            });
        }

        const reservationResults = [];
        const failedReservations = [];

        for (const item of items) {
            const { product_id, quantity } = item;

            // Check current availability and reserve
            const reserveQuery = `
                UPDATE "Product" 
                SET buying_in_progress = buying_in_progress + $1
                WHERE product_id = $2 
                  AND (total_available_stock - buying_in_progress) >= $1
                RETURNING product_id, name, total_available_stock, buying_in_progress
            `;

            const reserveResult = await client.query(reserveQuery, [quantity, product_id]);

            if (reserveResult.rows.length === 0) {
                // Failed to reserve - check why
                const checkQuery = `
                    SELECT product_id, name, total_available_stock, buying_in_progress,
                           (total_available_stock - buying_in_progress) as available_now
                    FROM "Product" 
                    WHERE product_id = $1
                `;
                const checkResult = await client.query(checkQuery, [product_id]);
                
                if (checkResult.rows.length > 0) {
                    const product = checkResult.rows[0];
                    failedReservations.push({
                        product_id,
                        name: product.name,
                        requested: quantity,
                        available: Math.max(0, product.available_now),
                        reason: 'Insufficient stock or concurrent purchase'
                    });
                }
            } else {
                const reserved = reserveResult.rows[0];
                reservationResults.push({
                    product_id: reserved.product_id,
                    name: reserved.name,
                    quantity_reserved: quantity,
                    new_buying_in_progress: reserved.buying_in_progress
                });
            }
        }

        if (failedReservations.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: 'Some items could not be reserved',
                failed_items: failedReservations
            });
        }

        await client.query('COMMIT');

        res.json({
            success: true,
            data: {
                reserved_items: reservationResults,
                message: 'Stock reserved successfully'
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error reserving stock:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reserve stock',
            error: error.message
        });
    } finally {
        client.release();
    }
};

// Release reserved stock
export const releaseStock = async (req, res) => {
    const client = await db.connect();

    try {
        await client.query('BEGIN');

        const { items } = req.body;

        for (const item of items) {
            const { product_id, quantity } = item;

            // Decrease buying_in_progress
            await client.query(`
                UPDATE "Product" 
                SET buying_in_progress = GREATEST(0, buying_in_progress - $1)
                WHERE product_id = $2
            `, [quantity, product_id]);
        }

        await client.query('COMMIT');

        res.json({
            success: true,
            message: 'Stock reservation released'
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error releasing stock:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to release stock',
            error: error.message
        });
    } finally {
        client.release();
    }
};

// Get real-time stock for specific products
export const getRealTimeStock = async (req, res) => {
    try {
        const { product_ids } = req.query; // Comma-separated product IDs

        if (!product_ids) {
            return res.status(400).json({
                success: false,
                message: 'Product IDs are required'
            });
        }

        const productIdArray = product_ids.split(',').map(id => parseInt(id));

        const stockQuery = `
            SELECT 
                product_id,
                name,
                total_available_stock,
                buying_in_progress,
                (total_available_stock - buying_in_progress) as available_now
            FROM "Product"
            WHERE product_id = ANY($1)
        `;

        const result = await db.query(stockQuery, [productIdArray]);

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Error getting real-time stock:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get stock information',
            error: error.message
        });
    }
};

// Simple cleanup function to reset buying_in_progress that might get stuck
// This is a safety mechanism in case stock doesn't get properly released
export const resetStuckStock = async (req, res) => {
    try {
        // This should only be used as an admin function or in emergencies
        // In normal operation, stock should be properly managed by the frontend
        const result = await db.query(`
            UPDATE "Product" 
            SET buying_in_progress = 0
            WHERE buying_in_progress > 0
        `);

        res.json({
            success: true,
            message: `Reset buying_in_progress for ${result.rowCount} products`,
            products_updated: result.rowCount
        });

    } catch (error) {
        console.error('Error resetting stuck stock:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reset stuck stock',
            error: error.message
        });
    }
};

// Get products with stuck buying_in_progress (for monitoring)
export const getStuckStock = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                product_id,
                name,
                total_available_stock,
                buying_in_progress,
                (total_available_stock - buying_in_progress) as available_now
            FROM "Product"
            WHERE buying_in_progress > 0
            ORDER BY buying_in_progress DESC
        `);

        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length
        });

    } catch (error) {
        console.error('Error getting stuck stock:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get stuck stock information',
            error: error.message
        });
    }
};
