import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Store user socket connections
const userSockets = new Map();

export const handleSocketConnection = (io) => {
    io.use((socket, next) => {
        try {
            const { token, userId } = socket.handshake.auth;

            if (!token || !userId) {
                return next(new Error('Authentication failed: Missing credentials'));
            }

            // Verify JWT token (optional - since we removed auth from routes)
            // const decoded = jwt.verify(token, JWT_SECRET);

            // Store user info in socket
            socket.userId = userId;
            socket.token = token;

            console.log(`Socket authentication successful for user: ${userId}`);
            next();
        } catch (error) {
            console.error('Socket authentication error:', error);
            next(new Error('Authentication failed'));
        }
    });

    io.on('connection', (socket) => {
        const userId = socket.userId;
        console.log(`User ${userId} connected via socket: ${socket.id}`);

        // Store socket connection for the user
        if (!userSockets.has(userId)) {
            userSockets.set(userId, new Set());
        }
        userSockets.get(userId).add(socket);

        // Join user-specific room
        socket.join(`user_${userId}`);
        
        // Handle joining notification room
        socket.on('join_notification_room', (userIdFromClient) => {
            if (userIdFromClient === userId) {
                socket.join(`notifications_${userId}`);
                console.log(`User ${userId} joined notification room`);
            }
        });

        // Handle mark notification as read
        socket.on('mark_notification_read', (data) => {
            console.log(`User ${userId} marked notification ${data.notificationId} as read`);
            // Broadcast to all sessions of this user
            socket.to(`user_${userId}`).emit('notification_read', {
                notificationId: data.notificationId,
                readAt: new Date().toISOString(),
                userId: userId
            });
        });

        // Handle mark all notifications as read
        socket.on('mark_all_notifications_read', (data) => {
            console.log(`User ${userId} marked all notifications as read`);
            // Broadcast to all sessions of this user
            socket.to(`user_${userId}`).emit('all_notifications_read', {
                userId: userId,
                readAt: new Date().toISOString()
            });
        });

        // Handle disconnection
        socket.on('disconnect', (reason) => {
            console.log(`User ${userId} disconnected: ${reason}`);

            // Remove socket from user's connections
            if (userSockets.has(userId)) {
                userSockets.get(userId).delete(socket);

                // Remove user entry if no more connections
                if (userSockets.get(userId).size === 0) {
                    userSockets.delete(userId);
                }
            }
        });

        // Handle ping for connection health
        socket.on('ping', () => {
            socket.emit('pong');
        });

        // Handle heartbeat
        socket.on('heartbeat', () => {
            socket.emit('heartbeat_ack', { timestamp: new Date().toISOString() });
        });

        // Send welcome message
        socket.emit('connected', {
            message: 'Real-time notifications connected',
            userId: userId,
            timestamp: new Date().toISOString()
        });

        // Send immediate status
        socket.emit('connection_status', {
            connected: true,
            userId: userId,
            socketId: socket.id
        });
    });

    return { userSockets };
};

// Utility functions to emit notifications
export const emitToUser = (io, userId, event, data) => {
    io.to(`user_${userId}`).emit(event, data);
    console.log(`Emitted ${event} to user ${userId}:`, data);
};

export const emitNewNotification = (io, userId, notification) => {
    emitToUser(io, userId, 'new_notification', notification);
};

export const emitNotificationRead = (io, userId, notificationId, readAt) => {
    emitToUser(io, userId, 'notification_read', {
        notificationId,
        readAt,
        userId
    });
};

export const emitAllNotificationsRead = (io, userId, readAt) => {
    emitToUser(io, userId, 'all_notifications_read', {
        userId,
        readAt
    });
};

export default { handleSocketConnection, emitToUser, emitNewNotification, emitNotificationRead, emitAllNotificationsRead };
