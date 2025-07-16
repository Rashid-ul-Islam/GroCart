// Simplified version of markProductsFetched - just updates status
export const markProductsFetchedSimple = async (req, res) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { delivery_id } = req.params;
        const { delivery_boy_id } = req.body;

        console.log('markProductsFetched called with:', { delivery_id, delivery_boy_id });

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

        // Simply update to "left_warehouse" status
        await updateOrderStatusHistory(client, orderId, 'left_warehouse', delivery_boy_id);

        await client.query('COMMIT');

        res.status(200).json({
            success: true,
            message: 'Products marked as fetched, delivery left warehouse'
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
