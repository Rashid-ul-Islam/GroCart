import pool from '../db.js';

// Submit delivery boy review to DeliveryPerformance table
export const submitDeliveryReview = async (req, res) => {
    const { order_id, rating, feedback } = req.body;
    const { user_id } = req.query;

    try {
        // Validate required fields
        if (!order_id || !rating || !user_id) {
            return res.status(400).json({
                success: false,
                message: 'Order ID, rating, and user ID are required'
            });
        }

        // Validate rating range
        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 1 and 5'
            });
        }

        // Convert order_id to number if it's in ORD-000001 format
        let orderIdNum = order_id;
        if (typeof order_id === 'string' && order_id.startsWith('ORD-')) {
            orderIdNum = parseInt(order_id.replace('ORD-', ''), 10);
        }

        // Get delivery and delivery boy details
        const deliveryQuery = `
            SELECT d.delivery_id, d.delivery_boy_id
            FROM "Delivery" d
            JOIN "Order" o ON d.order_id = o.order_id
            WHERE d.order_id = $1 AND o.user_id = $2
        `;

        const deliveryResult = await pool.query(deliveryQuery, [orderIdNum, user_id]);

        if (deliveryResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Delivery not found for this order'
            });
        }

        const { delivery_id, delivery_boy_id } = deliveryResult.rows[0];

        // Check if review already exists
        const existingReview = await pool.query(`
            SELECT delivery_boy_id FROM "DeliveryPerformance"
            WHERE delivery_boy_id = $1 AND delivery_id = $2
        `, [delivery_boy_id, delivery_id]);

        if (existingReview.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Review already submitted for this delivery'
            });
        }

        // Insert into DeliveryPerformance table
        await pool.query(`
            INSERT INTO "DeliveryPerformance" 
            (delivery_boy_id, delivery_id, customer_rating, feedback, recorded_at)
            VALUES ($1, $2, $3, $4, NOW())
        `, [delivery_boy_id, delivery_id, rating, feedback]);

        res.status(201).json({
            success: true,
            message: 'Delivery review submitted successfully'
        });

    } catch (error) {
        console.error('Error submitting delivery review:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit delivery review'
        });
    }
};

// Check if delivery review exists for an order
export const checkDeliveryReviewExists = async (req, res) => {
    const { order_id } = req.params;
    const { user_id } = req.query;

    try {
        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        // Convert order_id to number if it's in ORD-000001 format
        let orderIdNum = order_id;
        if (typeof order_id === 'string' && order_id.startsWith('ORD-')) {
            orderIdNum = parseInt(order_id.replace('ORD-', ''), 10);
        }

        // Check in DeliveryPerformance table
        const result = await pool.query(`
            SELECT dp.customer_rating, dp.feedback, dp.recorded_at
            FROM "DeliveryPerformance" dp
            JOIN "Delivery" d ON dp.delivery_id = d.delivery_id
            WHERE d.order_id = $1
        `, [orderIdNum]);

        res.json({
            success: true,
            data: {
                exists: result.rows.length > 0,
                review: result.rows.length > 0 ? result.rows[0] : null
            }
        });

    } catch (error) {
        console.error('Error checking delivery review:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check delivery review'
        });
    }
};

// Submit product review
export const submitProductReview = async (req, res) => {
    const { reviewType, itemId, orderId, userId, rating, comment } = req.body;

    try {
        // Validate required fields
        if (!itemId || !orderId || !userId || !rating) {
            return res.status(400).json({
                success: false,
                message: 'Product ID, order ID, user ID, and rating are required'
            });
        }

        // Validate rating range
        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 1 and 5'
            });
        }

        // Convert orderId to number if it's in ORD-000001 format
        let orderIdNum = orderId;
        if (typeof orderId === 'string' && orderId.startsWith('ORD-')) {
            orderIdNum = parseInt(orderId.replace('ORD-', ''), 10);
        }

        // Check if user has purchased this product (verify they actually bought it)
        const orderCheck = await pool.query(`
            SELECT oi.product_id, oi.quantity, p.name as product_name
            FROM "OrderItem" oi
            JOIN "Order" o ON oi.order_id = o.order_id
            JOIN "Product" p ON oi.product_id = p.product_id
            WHERE oi.product_id = $1 AND o.user_id = $2
        `, [itemId, userId]);

        if (orderCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'You have not purchased this product'
            });
        }

        // Insert the product review into the Review table
        const insertQuery = `
            INSERT INTO "Review" (product_id, user_id, rating, comment, review_date)
            VALUES ($1, $2, $3, $4, NOW())
            RETURNING review_id, product_id, user_id, rating, comment, review_date
        `;

        const result = await pool.query(insertQuery, [
            itemId,
            userId,
            rating,
            comment || null
        ]);

        const newReview = result.rows[0];

        res.status(201).json({
            success: true,
            message: 'Product review submitted successfully',
            data: {
                review_id: newReview.review_id,
                product_id: newReview.product_id,
                user_id: newReview.user_id,
                rating: newReview.rating,
                comment: newReview.comment,
                review_date: newReview.review_date,
                product_name: orderCheck.rows[0].product_name
            }
        });

    } catch (error) {
        console.error('Error submitting product review:', error);

        // Handle specific database errors
        if (error.code === '23503') { // Foreign key constraint violation
            return res.status(400).json({
                success: false,
                message: 'Invalid product, user, or order reference'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to submit product review. Please try again.'
        });
    }
};

// Check if product review exists for a user
export const checkProductReviewExists = async (req, res) => {
    const { order_id } = req.params;
    const { user_id } = req.query;

    try {
        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        // Check if any product review exists for this user (not order-specific)
        const result = await pool.query(`
            SELECT r.review_id, r.product_id, r.rating, r.comment, r.review_date, p.name as product_name
            FROM "Review" r
            JOIN "Product" p ON r.product_id = p.product_id
            WHERE r.user_id = $1
        `, [user_id]);

        res.json({
            success: true,
            data: {
                exists: result.rows.length > 0,
                reviews: result.rows
            }
        });

    } catch (error) {
        console.error('Error checking product review:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check product review'
        });
    }
};

// Get reviews for a specific product
export const getProductReviews = async (req, res) => {
    const { product_id } = req.params;
    const { limit = 10, offset = 0 } = req.query;

    try {
        // Validate product_id
        if (!product_id) {
            return res.status(400).json({
                success: false,
                message: 'Product ID is required'
            });
        }

        // Get reviews for the product
        const reviewQuery = `
            SELECT 
                r.review_id as id,
                r.rating,
                r.comment,
                r.review_date as date,
                u.username AS user_name,
                true as verified
            FROM "Review" r
            LEFT JOIN "User" u ON r.user_id = u.user_id
            WHERE r.product_id = $1
            ORDER BY r.review_date DESC
            LIMIT $2 OFFSET $3
        `;

        const reviewResult = await pool.query(reviewQuery, [product_id, limit, offset]);

        // Get total count of reviews
        const countQuery = `
            SELECT COUNT(*) as total
            FROM "Review" r
            WHERE r.product_id = $1
        `;

        const countResult = await pool.query(countQuery, [product_id]);
        const totalReviews = parseInt(countResult.rows[0].total);

        // Calculate average rating
        const avgQuery = `
            SELECT AVG(r.rating) as avg_rating
            FROM "Review" r
            WHERE r.product_id = $1
        `;

        const avgResult = await pool.query(avgQuery, [product_id]);
        const avgRating = parseFloat(avgResult.rows[0].avg_rating) || 0;

        res.status(200).json({
            success: true,
            message: 'Reviews fetched successfully',
            data: {
                reviews: reviewResult.rows,
                pagination: {
                    total: totalReviews,
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    has_more: (parseInt(offset) + parseInt(limit)) < totalReviews
                },
                stats: {
                    total_reviews: totalReviews,
                    average_rating: avgRating
                }
            }
        });

    } catch (error) {
        console.error('Error fetching product reviews:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch reviews',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};
