import React, { useState, useEffect, useRef } from "react";
import {
  Bell,
  X,
  CheckCircle,
  AlertCircle,
  Info,
  Star,
  DollarSign,
  Package,
  Gift,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { io } from "socket.io-client";

const UserNotification = () => {
  const { user, isLoggedIn } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const dropdownRef = useRef(null);
  const socketRef = useRef(null);

  // API base URL
  const API_BASE_URL = "http://localhost:3000/api";
  const SOCKET_URL = "http://localhost:3000";

  // Custom scrollbar styles for notifications list
  const scrollbarStyles = {
    scrollbarWidth: "thin",
    scrollbarColor: "#a855f7 #f3f4f6",
  };

  const webkitScrollbarStyles = `
    .notification-scrollbar::-webkit-scrollbar {
      width: 6px;
    }
    .notification-scrollbar::-webkit-scrollbar-track {
      background: #f3f4f6;
      border-radius: 3px;
    }
    .notification-scrollbar::-webkit-scrollbar-thumb {
      background: #d8b4fe;
      border-radius: 3px;
    }
    .notification-scrollbar::-webkit-scrollbar-thumb:hover {
      background: #a855f7;
    }
  `;

  // Initialize Socket.IO connection
  const initializeSocket = () => {
    if (!user?.user_id || socketRef.current) return;

    console.log("Initializing Socket.IO connection for user:", user.user_id);
    
    socketRef.current = io(SOCKET_URL, {
      auth: {
        userId: user.user_id,
        token: localStorage.getItem("token")
      },
      transports: ['websocket', 'polling'],
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000
    });

    // Connection events
    socketRef.current.on('connect', () => {
      console.log("Socket.IO connected successfully");
      setIsConnected(true);
      setError(null);
      
      // Join user-specific room for notifications
      socketRef.current.emit('join_notification_room', user.user_id);
      
      // Send connection confirmation
      console.log("Sending connection confirmation to server");
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log("Socket.IO disconnected:", reason);
      setIsConnected(false);
      
      // Auto-reconnect if disconnected unexpectedly
      if (reason === 'io server disconnect') {
        setTimeout(() => {
          socketRef.current.connect();
        }, 1000);
      }
    });

    socketRef.current.on('connect_error', (error) => {
      console.error("Socket.IO connection error:", error);
      setIsConnected(false);
      setError("Real-time connection failed");
    });

    socketRef.current.on('reconnect', (attemptNumber) => {
      console.log("Socket.IO reconnected after", attemptNumber, "attempts");
      setIsConnected(true);
      setError(null);
      // Re-join notification room after reconnection
      socketRef.current.emit('join_notification_room', user.user_id);
    });

    socketRef.current.on('reconnect_error', (error) => {
      console.error("Socket.IO reconnection error:", error);
    });

    // Handle connection status updates
    socketRef.current.on('connected', (data) => {
      console.log("Received connection confirmation:", data);
    });

    socketRef.current.on('connection_status', (data) => {
      console.log("Connection status:", data);
    });

    // Handle heartbeat response
    socketRef.current.on('heartbeat_ack', (data) => {
      console.log("Heartbeat acknowledged:", data);
    });

    // Notification events with better error handling
    socketRef.current.on('new_notification', (notification) => {
      console.log("🔔 Received new notification:", notification);
      
      try {
        // Ensure notification has required fields
        if (notification && notification.notification_id) {
          // Add new notification to the top of the list
          setNotifications(prev => {
            // Check if notification already exists to prevent duplicates
            const exists = prev.find(n => n.notification_id === notification.notification_id);
            if (exists) {
              console.log("Notification already exists, skipping duplicate");
              return prev;
            }
            
            console.log("Adding new notification to list");
            return [notification, ...prev];
          });
          
          // Update unread count
          setUnreadCount(prev => {
            const newCount = prev + 1;
            console.log("Updated unread count:", newCount);
            return newCount;
          });
          
          // Show browser notification if permission granted
          if (Notification.permission === "granted") {
            new Notification(notification.title || "New Notification", {
              body: notification.message || "You have a new notification",
              icon: "/favicon.ico",
              tag: notification.notification_id.toString(),
              silent: false
            });
          }
        } else {
          console.error("Invalid notification received:", notification);
        }
      } catch (error) {
        console.error("Error processing new notification:", error);
      }
    });

    socketRef.current.on('notification_read', (data) => {
      console.log("📖 Notification marked as read:", data);
      
      try {
        if (data && data.notificationId) {
          setNotifications(prev =>
            prev.map(notif =>
              notif.notification_id === data.notificationId
                ? { ...notif, is_read: true, read_at: data.readAt || new Date().toISOString() }
                : notif
            )
          );
          setUnreadCount(prev => {
            const newCount = Math.max(0, prev - 1);
            console.log("Updated unread count after read:", newCount);
            return newCount;
          });
        }
      } catch (error) {
        console.error("Error processing notification read event:", error);
      }
    });

    socketRef.current.on('all_notifications_read', (data) => {
      console.log("📚 All notifications marked as read for user:", data.userId);
      
      try {
        if (data && data.userId === user.user_id) {
          setNotifications(prev =>
            prev.map(notif => ({
              ...notif,
              is_read: true,
              read_at: data.readAt || new Date().toISOString()
            }))
          );
          setUnreadCount(0);
          console.log("Reset unread count to 0");
        }
      } catch (error) {
        console.error("Error processing all notifications read event:", error);
      }
    });

    // Handle notification updates (for status changes, etc.)
    socketRef.current.on('notification_updated', (data) => {
      console.log("🔄 Notification updated:", data);
      
      try {
        if (data && data.notification) {
          setNotifications(prev =>
            prev.map(notif =>
              notif.notification_id === data.notification.notification_id
                ? { ...notif, ...data.notification }
                : notif
            )
          );
        }
      } catch (error) {
        console.error("Error processing notification update:", error);
      }
    });

    // Handle notification deletion
    socketRef.current.on('notification_deleted', (data) => {
      console.log("🗑️ Notification deleted:", data);
      
      try {
        if (data && data.notificationId) {
          setNotifications(prev =>
            prev.filter(notif => notif.notification_id !== data.notificationId)
          );
          
          // Update unread count if deleted notification was unread
          if (!data.wasRead) {
            setUnreadCount(prev => Math.max(0, prev - 1));
          }
        }
      } catch (error) {
        console.error("Error processing notification deletion:", error);
      }
    });
  };

  // Cleanup socket connection
  const cleanupSocket = () => {
    if (socketRef.current) {
      console.log("Cleaning up Socket.IO connection");
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  };

  // Request notification permission
  const requestNotificationPermission = async () => {
    if ("Notification" in window && Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      console.log("Notification permission:", permission);
    }
  };

  // Test API connection
  const testApiConnection = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/test`);
      const data = await response.json();
      console.log("API test successful:", data);
      return true;
    } catch (error) {
      console.error("API test failed:", error);
      return false;
    }
  };

  // Create test notifications (for debugging)
  const createTestNotifications = async () => {
    if (!user?.user_id) {
      console.error("No user ID available for test notifications");
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/notifications/user/${user.user_id}/test`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        console.log("Test notifications created:", data);
        await fetchNotifications(); // Refresh the list
      } else {
        console.error("Failed to create test notifications:", data);
      }
    } catch (error) {
      console.error("Error creating test notifications:", error);
    }
  };

  // Fetch notifications from API
  const fetchNotifications = async () => {
    if (!isLoggedIn || !user?.user_id) {
      console.log("Cannot fetch notifications: not logged in or no user ID");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`Fetching notifications for user: ${user.user_id}`);

      const url = `${API_BASE_URL}/notifications/user/${user.user_id}?exclude=delivery_update`;
      console.log("Request URL:", url);

      const token = localStorage.getItem("token");
      console.log("Using token:", token ? "exists" : "missing");

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);

      const data = await response.json();
      console.log("Response data:", data);

      if (response.ok) {
        if (data.success) {
          const fetchedNotifications = data.data.notifications || [];
          const fetchedUnreadCount = data.data.unreadCount || 0;

          console.log(`Setting ${fetchedNotifications.length} notifications`);
          console.log(`Setting unread count to ${fetchedUnreadCount}`);

          setNotifications(fetchedNotifications);
          setUnreadCount(fetchedUnreadCount);
          setError(null);
        } else {
          const errorMsg = data.message || "API returned success: false";
          console.error("API error:", errorMsg);
          setError(errorMsg);
        }
      } else {
        const errorMsg = data.message || `HTTP ${response.status}`;
        console.error("HTTP error:", errorMsg);
        setError(errorMsg);
      }
    } catch (error) {
      console.error("Network error fetching notifications:", error);
      setError(`Network error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      console.log("Marking notification as read:", notificationId);

      // First check if the notification is already read
      const notification = notifications.find(n => n.notification_id === notificationId);
      if (notification && notification.is_read) {
        console.log("Notification already marked as read");
        return; // Already read, don't do anything
      }

      // Optimistically update UI first
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.notification_id === notificationId
            ? { ...notif, is_read: true, read_at: new Date().toISOString() }
            : notif
        )
      );
      
      // Only decrease count if notification was unread
      if (notification && !notification.is_read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      const response = await fetch(
        `${API_BASE_URL}/notifications/${notificationId}/read`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      console.log("Mark as read response:", data);

      if (!response.ok || !data.success) {
        console.error("Failed to mark notification as read:", data);
        // Revert optimistic update if API call failed (only if notification was unread)
        if (notification && !notification.is_read) {
          setNotifications((prev) =>
            prev.map((notif) =>
              notif.notification_id === notificationId
                ? { ...notif, is_read: false, read_at: null }
                : notif
            )
          );
          setUnreadCount((prev) => prev + 1);
        }
      } else {
        // Emit socket event for real-time sync across tabs
        if (socketRef.current && socketRef.current.connected) {
          socketRef.current.emit('mark_notification_read', {
            notificationId,
            userId: user.user_id
          });
        }
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
      // Revert optimistic update on error (only if notification was unread)
      if (notification && !notification.is_read) {
        setNotifications((prev) =>
          prev.map((notif) =>
            notif.notification_id === notificationId
              ? { ...notif, is_read: false, read_at: null }
              : notif
          )
        );
        setUnreadCount((prev) => prev + 1);
      }
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    if (!user?.user_id) return;

    try {
      console.log("Marking all notifications as read for user:", user.user_id);

      // Optimistically update UI first
      const currentTime = new Date().toISOString();
      setNotifications((prev) =>
        prev.map((notif) => ({
          ...notif,
          is_read: true,
          read_at: currentTime,
        }))
      );
      setUnreadCount(0);

      const response = await fetch(
        `${API_BASE_URL}/notifications/user/${user.user_id}/read-all`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      console.log("Mark all as read response:", data);

      if (!response.ok || !data.success) {
        console.error("Failed to mark all notifications as read:", data);
        // Revert optimistic update if API call failed
        fetchNotifications(); // Refresh from server
      } else {
        // Emit socket event for real-time sync across tabs
        if (socketRef.current && socketRef.current.connected) {
          socketRef.current.emit('mark_all_notifications_read', {
            userId: user.user_id
          });
        }
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      // Revert optimistic update on error
      fetchNotifications(); // Refresh from server
    }
  };

  // Get icon for notification type
  const getNotificationIcon = (type, priority) => {
    const iconProps = {
      className: `w-5 h-5 ${
        priority === "urgent"
          ? "text-red-500"
          : priority === "high"
          ? "text-orange-500"
          : priority === "medium"
          ? "text-blue-500"
          : "text-gray-500"
      }`,
    };

    switch (type) {
      case "order_status":
        return <Package {...iconProps} />;
      case "promotion":
        return <Gift {...iconProps} />;
      case "return_update":
        return <Package {...iconProps} />;
      case "wallet":
        return <DollarSign {...iconProps} />;
      case "system":
        return <Info {...iconProps} />;
      case "review_reminder":
        return <Star {...iconProps} />;
      case "stock_alert":
        return <AlertCircle {...iconProps} />;
      case "tier_update":
        return <TrendingUp {...iconProps} />;
      default:
        return <Bell {...iconProps} />;
    }
  };

  // Get priority color class
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "urgent":
        return "border-l-red-500 bg-red-50";
      case "high":
        return "border-l-orange-500 bg-orange-50";
      case "medium":
        return "border-l-blue-500 bg-blue-50";
      case "low":
        return "border-l-gray-500 bg-gray-50";
      default:
        return "border-l-gray-300 bg-white";
    }
  };

  // Format time ago
  const formatTimeAgo = (timestamp) => {
    const now = new Date();

    // Parse UTC timestamp
    let utcTime;
    if (timestamp.includes("T")) {
      const utcTimestamp = timestamp.endsWith("Z")
        ? timestamp
        : timestamp + "Z";
      utcTime = new Date(utcTimestamp);
    } else {
      utcTime = new Date(timestamp + "Z");
    }

    // Simple fix: Add 6 hours to UTC time to get Dhaka time
    const dhakaTime = new Date(utcTime.getTime() + 6 * 60 * 60 * 1000);

    // Calculate difference using current local time and adjusted Dhaka time
    const diffMs = now - dhakaTime;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return dhakaTime.toLocaleDateString();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Socket.IO and notification setup
  useEffect(() => {
    if (isLoggedIn && user?.user_id) {
      console.log("Setting up Socket.IO and fetching initial notifications");
      
      // Request notification permission
      requestNotificationPermission();
      
      // Initialize socket connection
      initializeSocket();
      
      // Fetch initial notifications
      fetchNotifications();
      
      // Set up periodic refresh as fallback (every 30 seconds)
      const refreshInterval = setInterval(() => {
        if (!isConnected) {
          console.log("Socket disconnected, fetching notifications manually");
          fetchNotifications();
        }
      }, 30000);

      // Set up heartbeat to keep connection alive
      const heartbeatInterval = setInterval(() => {
        if (socketRef.current && socketRef.current.connected) {
          socketRef.current.emit('heartbeat');
        }
      }, 25000); // Send heartbeat every 25 seconds
      
      return () => {
        clearInterval(refreshInterval);
        clearInterval(heartbeatInterval);
        cleanupSocket();
      };
    } else {
      console.log("Cleaning up: user not logged in");
      cleanupSocket();
      setNotifications([]);
      setUnreadCount(0);
      setError(null);
    }
  }, [isLoggedIn, user?.user_id]);

  // Separate effect to handle socket reconnection when connection is lost
  useEffect(() => {
    if (isLoggedIn && user?.user_id && !isConnected && !socketRef.current) {
      console.log("Attempting to reconnect socket...");
      const reconnectTimer = setTimeout(() => {
        initializeSocket();
      }, 2000);
      
      return () => clearTimeout(reconnectTimer);
    }
  }, [isConnected, isLoggedIn, user?.user_id]);

  // Handle window focus to refresh notifications if connection was lost
  useEffect(() => {
    const handleFocus = () => {
      if (isLoggedIn && user?.user_id) {
        // Check if socket is still connected, if not reconnect
        if (!socketRef.current || !socketRef.current.connected) {
          console.log("Window focused, reconnecting socket...");
          cleanupSocket();
          setTimeout(() => {
            initializeSocket();
          }, 1000);
        }
        // Always fetch latest notifications on focus
        fetchNotifications();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isLoggedIn, user?.user_id]);

  if (!isLoggedIn) {
    console.log("Not rendering notification component: user not logged in");
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Inject webkit scrollbar styles */}
      <style>{webkitScrollbarStyles}</style>

      {/* Notification Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-purple-700 hover:text-yellow-400 transition-colors duration-300 rounded-full hover:bg-yellow-100"
        title="Notifications"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold min-w-[20px] h-5 rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-[28rem] bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[32rem] overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-yellow-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold text-purple-900">
                  Notifications
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-purple-600 hover:text-purple-800 font-medium"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            {unreadCount > 0 && (
              <p className="text-sm text-purple-600 mt-1">
                {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
              </p>
            )}
          </div>

          {/* Notifications List */}
          <div
            className="max-h-[26rem] overflow-y-auto notification-scrollbar"
            style={scrollbarStyles}
          >
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.notification_id}
                    className={`p-4 transition-colors duration-200 border-l-4 ${
                      !notification.is_read
                        ? `${getPriorityColor(
                            notification.priority
                          )} hover:bg-opacity-80`
                        : "bg-white hover:bg-gray-50 border-l-gray-200"
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(
                          notification.notification_type,
                          notification.priority
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4
                              className={`text-sm font-medium ${
                                !notification.is_read
                                  ? "text-gray-900"
                                  : "text-gray-700"
                              }`}
                            >
                              {notification.title}
                            </h4>
                            <p
                              className={`text-sm mt-1 ${
                                !notification.is_read
                                  ? "text-gray-700"
                                  : "text-gray-500"
                              }`}
                            >
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-2">
                              {formatTimeAgo(notification.created_at)}
                            </p>
                          </div>
                          {!notification.is_read && (
                            <button
                              onClick={() =>
                                markAsRead(notification.notification_id)
                              }
                              className="ml-2 text-xs text-purple-600 hover:text-purple-800 font-medium"
                              title="Mark as read"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserNotification;
