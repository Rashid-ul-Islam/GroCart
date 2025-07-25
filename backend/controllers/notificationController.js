import pool from '../db.js';
import { emitNewNotification, emitNotificationRead, emitAllNotificationsRead } from '../socket/socketHandlers.js';

const notificationController = {
    // Get user notifications
    getUserNotifications: async (req, res) => {
        try {
            const { userId } = req.params;
            const { exclude, limit = 50, offset = 0 } = req.query;

            // Add logging for debugging
            console.log('Fetching notifications for user:', userId);
            console.log('Query params:', { exclude, limit, offset });

            // Validate userId
            if (!userId) {
                return res.status(400).json({
                    success: false,
                    message: 'User ID is required'
                });
            }

            let query = `
                SELECT 
                    notification_id,
                    user_id,
                    notification_type,
                    title,
                    message,
                    reference_type,
                    reference_id,
                    priority,
                    is_read,
                    is_pushed,
                    push_sent_at,
                    read_at,
                    expires_at,
                    created_at,
                    updated_at
                FROM "Notification" 
                WHERE user_id = $1
            `;

            const queryParams = [userId];
            let paramIndex = 2;

            // Add exclusion filter if provided
            if (exclude) {
                const excludeTypes = exclude.split(',').map(type => type.trim());
                query += ` AND notification_type NOT IN (${excludeTypes.map(() => `$${paramIndex++}`).join(', ')})`;
                queryParams.push(...excludeTypes);
            }

            // Filter out expired notifications
            query += ` AND (expires_at IS NULL OR expires_at > NOW())`;

            // Order by created_at desc and add pagination
            query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
            queryParams.push(parseInt(limit), parseInt(offset));

            console.log('Executing query:', query);
            console.log('Query params:', queryParams);

            const result = await pool.query(query, queryParams);
            console.log(`Found ${result.rows.length} notifications for user ${userId}`);

            // Get unread count
            let unreadQuery = `
                SELECT COUNT(*) as unread_count 
                FROM "Notification" 
                WHERE user_id = $1 AND is_read = false AND (expires_at IS NULL OR expires_at > NOW())
            `;
            const unreadParams = [userId];

            if (exclude) {
                const excludeTypes = exclude.split(',').map(type => type.trim());
                unreadQuery += ` AND notification_type NOT IN (${excludeTypes.map((_, index) => `$${index + 2}`).join(', ')})`;
                unreadParams.push(...excludeTypes);
            }

            const unreadResult = await pool.query(unreadQuery, unreadParams);
            const unreadCount = parseInt(unreadResult.rows[0].unread_count);

            console.log(`Unread count for user ${userId}:`, unreadCount);

            // Get total count for pagination
            let totalQuery = `
                SELECT COUNT(*) as total_count 
                FROM "Notification" 
                WHERE user_id = $1 AND (expires_at IS NULL OR expires_at > NOW())
            `;
            const totalParams = [userId];

            if (exclude) {
                const excludeTypes = exclude.split(',').map(type => type.trim());
                totalQuery += ` AND notification_type NOT IN (${excludeTypes.map((_, index) => `$${index + 2}`).join(', ')})`;
                totalParams.push(...excludeTypes);
            }

            const totalResult = await pool.query(totalQuery, totalParams);
            const totalCount = parseInt(totalResult.rows[0].total_count);

            const response = {
                success: true,
                data: {
                    notifications: result.rows,
                    unreadCount: unreadCount,
                    total: totalCount,
                    hasMore: (parseInt(offset) + result.rows.length) < totalCount,
                    currentPage: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
                    totalPages: Math.ceil(totalCount / parseInt(limit))
                }
            };

            console.log('Sending response:', {
                notificationCount: response.data.notifications.length,
                unreadCount: response.data.unreadCount,
                total: response.data.total
            });

            res.json(response);
        } catch (error) {
            console.error('Error fetching user notifications:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch notifications',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    },

    // Mark notification as read
    markAsRead: async (req, res) => {
        try {
            const { notificationId } = req.params;

            console.log('Marking notification as read:', notificationId);

            if (!notificationId) {
                return res.status(400).json({
                    success: false,
                    message: 'Notification ID is required'
                });
            }

            const result = await pool.query(
                `UPDATE "Notification" 
                 SET is_read = true, read_at = NOW(), updated_at = NOW()
                 WHERE notification_id = $1
                 RETURNING *`,
                [notificationId]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Notification not found'
                });
            }

            console.log('Notification marked as read:', result.rows[0].notification_id);

            const notification = result.rows[0];

            // Emit real-time update
            const io = req.app.get('io');
            if (io) {
                emitNotificationRead(io, notification.user_id, notificationId, notification.read_at);
            }

            res.json({
                success: true,
                message: 'Notification marked as read',
                data: result.rows[0]
            });
        } catch (error) {
            console.error('Error marking notification as read:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to mark notification as read',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    },

    // Mark all notifications as read for a user
    markAllAsRead: async (req, res) => {
        try {
            const { userId } = req.params;

            console.log('Marking all notifications as read for user:', userId);

            if (!userId) {
                return res.status(400).json({
                    success: false,
                    message: 'User ID is required'
                });
            }

            const result = await pool.query(
                `UPDATE "Notification" 
                 SET is_read = true, read_at = NOW(), updated_at = NOW()
                 WHERE user_id = $1 AND is_read = false
                 RETURNING notification_id`,
                [userId]
            );

            console.log(`Marked ${result.rows.length} notifications as read for user ${userId}`);

            // Emit real-time update
            const io = req.app.get('io');
            if (io) {
                emitAllNotificationsRead(io, userId, new Date().toISOString());
            }

            res.json({
                success: true,
                message: `${result.rows.length} notifications marked as read`,
                data: {
                    updatedCount: result.rows.length
                }
            });
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to mark all notifications as read',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    },

    // Create a new notification
    createNotification: async (req, res) => {
        try {
            const {
                user_id,
                notification_type,
                title,
                message,
                reference_type,
                reference_id,
                priority = 'medium',
                expires_at
            } = req.body;

            console.log('Creating notification:', { user_id, notification_type, title });

            // Validate required fields
            if (!user_id || !notification_type || !title || !message) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields: user_id, notification_type, title, message'
                });
            }

            // Validate priority
            const validPriorities = ['low', 'medium', 'high', 'urgent'];
            if (!validPriorities.includes(priority)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid priority. Must be one of: low, medium, high, urgent'
                });
            }

            const result = await pool.query(
                `INSERT INTO "Notification" 
                 (user_id, notification_type, title, message, reference_type, reference_id, priority, expires_at, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
                 RETURNING *`,
                [user_id, notification_type, title, message, reference_type, reference_id, priority, expires_at]
            );

            console.log('Notification created:', result.rows[0].notification_id);

            const newNotification = result.rows[0];

            // Emit real-time notification to user
            const io = req.app.get('io');
            if (io && newNotification.notification_type !== 'delivery_update') {
                emitNewNotification(io, user_id, newNotification);
            }

            res.status(201).json({
                success: true,
                message: 'Notification created successfully',
                data: result.rows[0]
            });
        } catch (error) {
            console.error('Error creating notification:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create notification',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    },

    // Delete notification
    deleteNotification: async (req, res) => {
        try {
            const { notificationId } = req.params;

            console.log('Deleting notification:', notificationId);

            if (!notificationId) {
                return res.status(400).json({
                    success: false,
                    message: 'Notification ID is required'
                });
            }

            const result = await pool.query(
                `DELETE FROM "Notification" 
                 WHERE notification_id = $1
                 RETURNING notification_id`,
                [notificationId]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Notification not found'
                });
            }

            console.log('Notification deleted:', result.rows[0].notification_id);

            res.json({
                success: true,
                message: 'Notification deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting notification:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete notification',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    },

    // Get unread count for a user
    getUnreadCount: async (req, res) => {
        try {
            const { userId } = req.params;
            const { exclude } = req.query;

            console.log('Getting unread count for user:', userId);

            if (!userId) {
                return res.status(400).json({
                    success: false,
                    message: 'User ID is required'
                });
            }

            let query = `
                SELECT COUNT(*) as unread_count 
                FROM "Notification" 
                WHERE user_id = $1 AND is_read = false AND (expires_at IS NULL OR expires_at > NOW())
            `;
            const queryParams = [userId];

            if (exclude) {
                const excludeTypes = exclude.split(',').map(type => type.trim());
                query += ` AND notification_type NOT IN (${excludeTypes.map((_, index) => `$${index + 2}`).join(', ')})`;
                queryParams.push(...excludeTypes);
            }

            const result = await pool.query(query, queryParams);
            const unreadCount = parseInt(result.rows[0].unread_count);

            console.log(`Unread count for user ${userId}:`, unreadCount);

            res.json({
                success: true,
                data: {
                    unreadCount: unreadCount
                }
            });
        } catch (error) {
            console.error('Error getting unread count:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get unread count',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    },

    // Test endpoint to create sample notifications
    createTestNotifications: async (req, res) => {
        try {
            const { userId } = req.params;

            if (!userId) {
                return res.status(400).json({
                    success: false,
                    message: 'User ID is required'
                });
            }

            const testNotifications = [
                {
                    user_id: userId,
                    notification_type: 'system',
                    title: 'Welcome!',
                    message: 'Welcome to our platform! Start exploring now.',
                    priority: 'medium'
                },
                {
                    user_id: userId,
                    notification_type: 'promotion',
                    title: 'Special Offer',
                    message: 'Get 20% off on your next order!',
                    priority: 'high'
                },
                {
                    user_id: userId,
                    notification_type: 'order_status',
                    title: 'Order Update',
                    message: 'Your order has been processed and is ready for delivery.',
                    priority: 'medium'
                }
            ];

            const createdNotifications = [];

            for (const notification of testNotifications) {
                const result = await pool.query(
                    `INSERT INTO "Notification" 
                     (user_id, notification_type, title, message, priority, created_at, updated_at)
                     VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
                     RETURNING *`,
                    [notification.user_id, notification.notification_type, notification.title, notification.message, notification.priority]
                );
                createdNotifications.push(result.rows[0]);
            }

            console.log(`Created ${createdNotifications.length} test notifications for user ${userId}`);

            res.status(201).json({
                success: true,
                message: `Created ${createdNotifications.length} test notifications`,
                data: createdNotifications
            });
        } catch (error) {
            console.error('Error creating test notifications:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create test notifications',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
};

export default notificationController;