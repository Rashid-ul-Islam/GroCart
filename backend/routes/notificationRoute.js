import express from 'express';
import notificationController from '../controllers/notificationController.js';

const router = express.Router();

// Test endpoint to check if routes are working
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Notification routes are working',
        timestamp: new Date().toISOString()
    });
});

// Get user notifications
router.get('/user/:userId', notificationController.getUserNotifications);

// Get unread count for a user
router.get('/user/:userId/unread-count', notificationController.getUnreadCount);

// Create test notifications (for debugging)
router.post('/user/:userId/test', notificationController.createTestNotifications);

// Mark notification as read
router.put('/:notificationId/read', notificationController.markAsRead);

// Mark all notifications as read for a user
router.put('/user/:userId/read-all', notificationController.markAllAsRead);

// Create a new notification (for admin or system use)
router.post('/', notificationController.createNotification);

// Delete notification
router.delete('/:notificationId', notificationController.deleteNotification);

export default router;