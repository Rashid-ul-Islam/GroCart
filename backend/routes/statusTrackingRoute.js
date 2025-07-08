import express from 'express';
import { getStatusHistory, getCurrentStatus, migrateOrderStatusHistory } from '../controllers/statusTrackingUtility.js';

const router = express.Router();

// Get status history for an order
router.get('/order/:orderId/history', async (req, res) => {
    try {
        const { orderId } = req.params;
        const history = await getStatusHistory('order', orderId);

        res.json({
            success: true,
            data: history
        });
    } catch (error) {
        console.error('Error fetching order status history:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch order status history'
        });
    }
});

// Get status history for a delivery
router.get('/delivery/:deliveryId/history', async (req, res) => {
    try {
        const { deliveryId } = req.params;
        const history = await getStatusHistory('delivery', deliveryId);

        res.json({
            success: true,
            data: history
        });
    } catch (error) {
        console.error('Error fetching delivery status history:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch delivery status history'
        });
    }
});

// Get current status for an entity
router.get('/:entityType/:entityId/current-status', async (req, res) => {
    try {
        const { entityType, entityId } = req.params;

        if (!['order', 'delivery'].includes(entityType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid entity type. Must be "order" or "delivery"'
            });
        }

        const currentStatus = await getCurrentStatus(entityType, entityId);

        res.json({
            success: true,
            data: currentStatus
        });
    } catch (error) {
        console.error('Error fetching current status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch current status'
        });
    }
});

// Migration endpoint (admin only) - migrate OrderStatusHistory to StatusHistory
router.post('/migrate-order-status', async (req, res) => {
    try {
        await migrateOrderStatusHistory();

        res.json({
            success: true,
            message: 'Order status history migration completed successfully'
        });
    } catch (error) {
        console.error('Error during migration:', error);
        res.status(500).json({
            success: false,
            message: 'Migration failed'
        });
    }
});

export default router;
