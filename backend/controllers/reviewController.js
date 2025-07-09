import pool from '../db.js';

export const submitReview = async (req, res) => {
    const {
        reviewType, // 'product' or 'delivery'
        itemId, // product_id or delivery_id
        orderId, // string like 'ORD-000001'
        userId,
        rating,
        comment
    } = req.body;

    if (!reviewType || !itemId || !orderId || !userId || !rating) {
        return res.status(400).json({ success: false, message: 'Missing required fields.' });
    }

    if (rating < 1 || rating > 5) {
        return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5.' });
    }

    const orderIdNum = parseInt(orderId.replace('ORD-', ''), 10);
    if (isNaN(orderIdNum)) {
        return res.status(400).json({ success: false, message: 'Invalid Order ID format.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Verify the user actually ordered the item/delivery
        const verificationQuery = reviewType === 'product'
            ? `SELECT oi.order_item_id FROM "OrderItem" oi JOIN "Order" o ON oi.order_id = o.order_id WHERE o.order_id = $1 AND o.user_id = $2 AND oi.product_id = $3`
            : `SELECT d.delivery_id, d.delivery_boy_id FROM "Delivery" d JOIN "Order" o ON d.order_id = o.order_id WHERE d.order_id = $1 AND o.user_id = $2 AND d.delivery_id = $3`;

        const verificationResult = await client.query(verificationQuery, [orderIdNum, userId, itemId]);

        if (verificationResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(403).json({ success: false, message: 'Cannot review an item you did not purchase or find the specified order.' });
        }

        if (reviewType === 'product') {
            // Check if a review for this product from this specific order already exists
            const existingReview = await client.query('SELECT review_id FROM "Review" WHERE product_id = $1 AND user_id = $2 AND order_id = $3', [itemId, userId, orderIdNum]);
            if (existingReview.rows.length > 0) {
                // Update existing review for that order
                await client.query('UPDATE "Review" SET rating = $1, comment = $2, review_date = NOW() WHERE review_id = $3', [rating, comment, existingReview.rows[0].review_id]);
            } else {
                // Insert new review linked to the order
                await client.query(
                    'INSERT INTO "Review" (product_id, user_id, rating, comment, review_date, review_status, verified_purchase, order_id) VALUES ($1, $2, $3, $4, NOW(), \'pending\', true, $5)',
                    [itemId, userId, rating, comment, orderIdNum]
                );
            }
        } else { // 'delivery'
            const { delivery_boy_id } = verificationResult.rows[0];
            if (!delivery_boy_id) {
                await client.query('ROLLBACK');
                return res.status(400).json({ success: false, message: 'This delivery has no assigned delivery boy to review.' });
            }
            // Check if a review for this delivery already exists
            const existingReview = await client.query('SELECT review_id FROM "DeliveryReview" WHERE delivery_id = $1 AND customer_id = $2', [itemId, userId]);
            if (existingReview.rows.length > 0) {
                await client.query('UPDATE "DeliveryReview" SET rating = $1, comment = $2, review_date = NOW() WHERE review_id = $3', [rating, comment, existingReview.rows[0].review_id]);
            } else {
                await client.query('INSERT INTO "DeliveryReview" (delivery_id, delivery_boy_id, customer_id, rating, comment, review_date) VALUES ($1, $2, $3, $4, $5, NOW())', [itemId, delivery_boy_id, userId, rating, comment]);
            }
        }

        await client.query('COMMIT');
        res.status(201).json({ success: true, message: 'Review submitted successfully.' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error submitting review:', error);
        res.status(500).json({ success: false, message: 'Failed to submit review.', error: error.message });
    } finally {
        client.release();
    }
};
