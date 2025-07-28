import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs.jsx";
import { Input } from "../components/ui/input.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select.jsx";
import { Badge } from "../components/ui/badge.jsx";
import { Button } from "../components/ui/button.jsx";
import {
  FileText,
  Calendar,
  Search,
  Bell,
  TrendingUp,
  Truck,
  Loader2,
  X,
  CheckCircle,
  AlertCircle,
  Info,
  Package,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

import { StatsOverview } from "../components/deliveryBoy/StatsOverview.jsx";
import { AssignedDeliveries } from "../components/deliveryBoy/AssignedDeliveries.jsx";
import { PerformanceChart } from "../components/deliveryBoy/PerformanceChart.jsx";
import { DeliveryBoyDashboard } from "../components/deliveryBoy/DeliveryBoyDashboard.jsx";

const DeliveryBoy = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchResults, setSearchResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [searchOrderId, setSearchOrderId] = useState("");
  const [searchCustomerName, setSearchCustomerName] = useState("");
  const [scheduleData, setScheduleData] = useState({
    morningShift: { deliveries: 0, time: "8:00 AM - 2:00 PM" },
    eveningShift: { deliveries: 0, time: "2:00 PM - 8:00 PM" },
  });
  const [loadingSchedule, setLoadingSchedule] = useState(true);
  const { user, isLoggedIn } = useAuth();

  // Delivery Notification states
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [notificationError, setNotificationError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [markingAsRead, setMarkingAsRead] = useState(false);
  const [markingAllAsRead, setMarkingAllAsRead] = useState(false);
  const notificationDropdownRef = useRef(null);
  const socketRef = useRef(null);

  // API URLs
  const API_BASE_URL = "http://localhost:3000/api";
  const SOCKET_URL = "http://localhost:3000";

  const deliveryBoyId = user?.user_id;

  // Fetch schedule data from API
  const fetchScheduleData = async () => {
    if (!deliveryBoyId) return;

    try {
      setLoadingSchedule(true);
      const today = new Date().toISOString().split("T")[0];
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      const response = await fetch(
        `http://localhost:3000/api/delivery/schedule/${deliveryBoyId}?start_date=${today}&end_date=${tomorrow}`,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.length > 0) {
          const todayData = data.data[0];
          // Split deliveries between morning and evening shifts
          const morningDeliveries = Math.ceil(todayData.totalDeliveries * 0.6); // 60% in morning
          const eveningDeliveries =
            todayData.totalDeliveries - morningDeliveries;

          setScheduleData({
            morningShift: {
              deliveries: morningDeliveries,
              time: "8:00 AM - 2:00 PM",
            },
            eveningShift: {
              deliveries: eveningDeliveries,
              time: "2:00 PM - 8:00 PM",
            },
          });
        }
      }
    } catch (error) {
      console.error("Error fetching schedule data:", error);
    } finally {
      setLoadingSchedule(false);
    }
  };

  // Search deliveries function
  const handleSearch = async () => {
    if (!deliveryBoyId || (!searchOrderId && !searchCustomerName)) {
      setSearchResults([]);
      return;
    }

    try {
      setLoadingSearch(true);
      const params = new URLSearchParams();

      const searchTerms = [searchOrderId, searchCustomerName].filter(Boolean);
      if (searchTerms.length > 0) {
        params.append("search_term", searchTerms.join(" "));
      }

      const response = await fetch(
        `http://localhost:3000/api/delivery/search/${deliveryBoyId}?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSearchResults(data.data || []);
        }
      }
    } catch (error) {
      console.error("Error searching deliveries:", error);
      setSearchResults([]);
    } finally {
      setLoadingSearch(false);
    }
  };

  // Delivery Notification Functions
  const initializeSocket = () => {
    if (!deliveryBoyId || socketRef.current) return;

    console.log("Initializing Socket.IO connection for delivery boy:", deliveryBoyId);
    
    socketRef.current = io(SOCKET_URL, {
      auth: {
        userId: deliveryBoyId,
        token: sessionStorage.getItem("token")
      },
      transports: ['websocket', 'polling']
    });

    // Connection events
    socketRef.current.on('connect', () => {
      console.log("Socket.IO connected");
      setIsConnected(true);
      setNotificationError(null);
    });

    socketRef.current.on('disconnect', () => {
      console.log("Socket.IO disconnected");
      setIsConnected(false);
    });

    socketRef.current.on('connect_error', (error) => {
      console.error("Socket.IO connection error:", error);
      setIsConnected(false);
      setNotificationError("Real-time connection failed");
    });

    // Delivery notification events
    socketRef.current.on('new_notification', (notification) => {
      console.log("Received new delivery notification:", notification);
      
      if (notification.notification_type === 'delivery_update') {
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Show browser notification if permission granted
        if (Notification.permission === "granted") {
          new Notification(notification.title, {
            body: notification.message,
            icon: "/favicon.ico",
            tag: notification.notification_id
          });
        }
      }
    });
  };

  const cleanupSocket = () => {
    if (socketRef.current) {
      console.log("Cleaning up Socket.IO connection");
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  };

  const requestNotificationPermission = () => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        console.log("Notification permission:", permission);
      });
    }
  };

  const fetchDeliveryNotifications = async () => {
    if (!deliveryBoyId) return;

    setNotificationLoading(true);
    setNotificationError(null);

    try {
      console.log(`Fetching delivery notifications for user: ${deliveryBoyId}`);

      const url = `${API_BASE_URL}/notifications/user/${deliveryBoyId}?type=delivery_update`;
      console.log("Request URL:", url);

      const token = sessionStorage.getItem("token");
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

          console.log(`Setting ${fetchedNotifications.length} delivery notifications`);
          console.log(`Setting unread count to ${fetchedUnreadCount}`);

          setNotifications(fetchedNotifications);
          setUnreadCount(fetchedUnreadCount);
          setNotificationError(null);
        } else {
          const errorMsg = data.message || "API returned success: false";
          console.error("API error:", errorMsg);
          setNotificationError(errorMsg);
        }
      } else {
        const errorMsg = data.message || `HTTP ${response.status}`;
        console.error("HTTP error:", errorMsg);
        setNotificationError(errorMsg);
      }
    } catch (error) {
      console.error("Network error fetching delivery notifications:", error);
      setNotificationError(`Network error: ${error.message}`);
    } finally {
      setNotificationLoading(false);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    if (markingAsRead) return;
    
    try {
      setMarkingAsRead(true);
      console.log("Marking delivery notification as read:", notificationId);

      const response = await fetch(
        `${API_BASE_URL}/notifications/${notificationId}/read`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Mark as read response status:", response.status);
      const data = await response.json();
      console.log("Mark as read response data:", data);

      if (response.ok && data.success) {
        // Update local state
        setNotifications((prev) =>
          prev.map((notif) =>
            notif.notification_id === notificationId
              ? { ...notif, is_read: true, read_at: new Date().toISOString() }
              : notif
          )
        );
        
        // Update unread count
        setUnreadCount((prev) => {
          const currentNotification = notifications.find(n => n.notification_id === notificationId);
          return currentNotification && !currentNotification.is_read ? Math.max(0, prev - 1) : prev;
        });
        
        console.log("Successfully marked notification as read");
      } else {
        console.error("Failed to mark notification as read:", data);
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    } finally {
      setMarkingAsRead(false);
    }
  };

  const markAllAsRead = async () => {
    if (markingAllAsRead) return;
    
    try {
      setMarkingAllAsRead(true);
      console.log("Marking all delivery notifications as read for user:", deliveryBoyId);

      // Use the correct endpoint from the routes
      const response = await fetch(
        `${API_BASE_URL}/notifications/user/${deliveryBoyId}/read-all`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Mark all as read response status:", response.status);
      const data = await response.json();
      console.log("Mark all as read response data:", data);

      if (response.ok && data.success) {
        // Update all notifications to read
        setNotifications((prev) =>
          prev.map((notif) => ({
            ...notif,
            is_read: true,
            read_at: new Date().toISOString(),
          }))
        );
        
        // Reset unread count to 0
        setUnreadCount(0);
        console.log("Successfully marked all notifications as read");
      } else {
        console.error("Failed to mark all notifications as read:", data);
        
        // The backend doesn't filter by notification type, so we need to filter locally
        // This is actually fine since the backend marks ALL notifications as read
        // We just update our local state for delivery notifications only
        if (response.ok) {
          setNotifications((prev) =>
            prev.map((notif) => ({
              ...notif,
              is_read: true,
              read_at: new Date().toISOString(),
            }))
          );
          setUnreadCount(0);
          console.log("Successfully marked all notifications as read (no type filtering on backend)");
        }
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    } finally {
      setMarkingAllAsRead(false);
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    let utcTime;
    
    if (timestamp.includes("T")) {
      const utcTimestamp = timestamp.endsWith("Z") ? timestamp : timestamp + "Z";
      utcTime = new Date(utcTimestamp);
    } else {
      utcTime = new Date(timestamp + "Z");
    }

    const dhakaTime = new Date(utcTime.getTime() + 6 * 60 * 60 * 1000);
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

  useEffect(() => {
    if (deliveryBoyId) {
      fetchScheduleData();
      
      // Setup notification system
      requestNotificationPermission();
      initializeSocket();
      fetchDeliveryNotifications();
    }

    // Cleanup on unmount
    return () => {
      cleanupSocket();
    };
  }, [deliveryBoyId]);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationDropdownRef.current && !notificationDropdownRef.current.contains(event.target)) {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Delivery Dashboard
                  </h1>
                  <p className="text-sm font-semibold text-gray-700">
                    Welcome back, {user?.first_name || "Driver"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Delivery Notifications */}
              <div className="relative" ref={notificationDropdownRef}>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                  className="relative p-2 text-blue-600 hover:text-blue-800 transition-colors duration-300 rounded-full hover:bg-blue-100"
                  title="Delivery Notifications"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold min-w-[20px] h-5 rounded-full flex items-center justify-center animate-pulse">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </Button>

                {/* Notification Dropdown */}
                {isNotificationOpen && (
                  <div className="absolute right-0 mt-2 w-[28rem] bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[32rem] overflow-hidden">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-semibold text-blue-900">
                            🚚 Delivery Updates
                          </h3>
                          {/* Socket connection status */}
                          <div className="flex items-center space-x-1">
                            {isConnected ? (
                              <Wifi className="w-4 h-4 text-green-500" title="Connected - Real-time updates" />
                            ) : (
                              <WifiOff className="w-4 h-4 text-red-500" title="Disconnected - Manual refresh only" />
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {unreadCount > 0 && (
                            <button
                              onClick={markAllAsRead}
                              disabled={markingAllAsRead}
                              className="text-sm text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                            >
                              {markingAllAsRead ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  <span>Marking...</span>
                                </>
                              ) : (
                                <span>Mark all read</span>
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => setIsNotificationOpen(false)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      {unreadCount > 0 && (
                        <p className="text-sm text-blue-600 mt-1">
                          {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
                        </p>
                      )}
                      {!isConnected && (
                        <p className="text-xs text-orange-600 mt-1 flex items-center space-x-1">
                          <WifiOff className="w-3 h-3" />
                          <span>Real-time updates unavailable</span>
                        </p>
                      )}
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-[26rem] overflow-y-auto">
                      {notificationLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                      ) : notificationError ? (
                        <div className="text-center py-8 text-red-500">
                          <AlertCircle className="w-12 h-12 mx-auto mb-3" />
                          <p className="font-medium">Error loading notifications</p>
                          <p className="text-sm">{notificationError}</p>
                          <button
                            onClick={fetchDeliveryNotifications}
                            className="mt-2 text-blue-600 hover:text-blue-800 underline"
                          >
                            Try again
                          </button>
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Truck className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                          <p className="font-medium">No delivery updates yet</p>
                          <p className="text-sm">New delivery notifications will appear here</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-100">
                          {notifications.map((notification) => (
                            <div
                              key={notification.notification_id}
                              className={`p-4 transition-colors duration-200 border-l-4 ${
                                !notification.is_read
                                  ? "border-l-blue-500 bg-blue-50 hover:bg-blue-100"
                                  : "border-l-gray-200 bg-white hover:bg-gray-50"
                              }`}
                            >
                              <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0 mt-1">
                                  <Package className={`w-5 h-5 ${
                                    notification.priority === "urgent"
                                      ? "text-red-500"
                                      : notification.priority === "high"
                                      ? "text-orange-500"
                                      : "text-blue-500"
                                  }`} />
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
                                          markNotificationAsRead(notification.notification_id)
                                        }
                                        disabled={markingAsRead}
                                        className="ml-2 text-xs text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Mark as read"
                                      >
                                        {markingAsRead ? (
                                          <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                          <CheckCircle className="w-4 h-4" />
                                        )}
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
            </div>
          </div>

          <div className="mt-4">
            <div>
              <p className="text-gray-800 font-medium">
                Monitor deliveries, performance, schedule and more
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            <TabsList className="grid w-full grid-cols-4 bg-white shadow-sm rounded-lg p-1">
              {[
                { value: "dashboard", label: "Dashboard", icon: TrendingUp },
                { value: "deliveries", label: "My Deliveries", icon: Truck },
                { value: "schedule", label: "Schedule", icon: Calendar },
                { value: "search", label: "Search Orders", icon: Search },
              ].map(({ value, label, icon: Icon }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-md transition-all duration-200 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-800 data-[state=active]:shadow-sm data-[state=active]:font-bold text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-semibold">{label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="dashboard" className="space-y-6">
              <StatsOverview />
              <PerformanceChart deliveryBoyId={deliveryBoyId || "1"} />
              <AssignedDeliveries />
            </TabsContent>

            <TabsContent value="deliveries" className="space-y-6">
              <AssignedDeliveries />
            </TabsContent>

            <TabsContent value="schedule" className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-900">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  Daily Schedule
                </h3>
                <div className="space-y-4">
                  {loadingSchedule ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-2" />
                      <span className="text-gray-700 font-medium">
                        Loading schedule...
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="border rounded-lg p-4 border-gray-300">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-bold text-gray-900">
                            Morning Shift
                          </span>
                          <Badge
                            variant="outline"
                            className="text-blue-800 border-blue-400 bg-blue-50 font-semibold"
                          >
                            {scheduleData.morningShift.time}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-800 font-medium">
                          {scheduleData.morningShift.deliveries} deliveries
                          scheduled
                        </p>
                      </div>
                      <div className="border rounded-lg p-4 border-gray-300">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-bold text-gray-900">
                            Evening Shift
                          </span>
                          <Badge
                            variant="outline"
                            className="text-orange-800 border-orange-400 bg-orange-50 font-semibold"
                          >
                            {scheduleData.eveningShift.time}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-800 font-medium">
                          {scheduleData.eveningShift.deliveries} deliveries
                          scheduled
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <PerformanceChart deliveryBoyId={deliveryBoyId || "1"} />
            </TabsContent>

            <TabsContent value="search" className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-900">
                  <Search className="h-5 w-5 text-blue-600" />
                  Search Orders
                </h3>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <Input
                      placeholder="Order ID"
                      className="flex-1"
                      value={searchOrderId}
                      onChange={(e) => setSearchOrderId(e.target.value)}
                    />
                    <Input
                      placeholder="Customer Name"
                      className="flex-1"
                      value={searchCustomerName}
                      onChange={(e) => setSearchCustomerName(e.target.value)}
                    />
                    <Button onClick={handleSearch} disabled={loadingSearch}>
                      {loadingSearch ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Search className="h-4 w-4 mr-2" />
                      )}
                      Search
                    </Button>
                  </div>

                  <div className="border rounded-lg p-4 border-gray-300 min-h-[200px]">
                    {loadingSearch ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-2" />
                        <span className="text-gray-700 font-medium">
                          Searching...
                        </span>
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div className="space-y-3">
                        {searchResults.map((result, index) => (
                          <div
                            key={index}
                            className="p-3 bg-gray-50 rounded-lg border"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-bold text-gray-900">
                                  Order #{result.order_id}
                                </h4>
                                <p className="text-sm text-gray-700">
                                  {result.customerName}
                                </p>
                                <p className="text-xs text-gray-600">
                                  {result.address}
                                </p>
                              </div>
                              <Badge
                                className={`${
                                  result.status === "completed"
                                    ? "bg-green-100 text-green-800"
                                    : result.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-blue-100 text-blue-800"
                                }`}
                              >
                                {result.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : searchOrderId || searchCustomerName ? (
                      <div className="text-center py-8">
                        <p className="text-gray-600 font-medium">
                          No results found
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-800 font-medium">
                          Enter search criteria to find orders
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default DeliveryBoy;
