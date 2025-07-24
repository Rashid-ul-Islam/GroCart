import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card.jsx";
import { Badge } from "../ui/badge.jsx";
import { Button } from "../ui/button.jsx";
import { Progress } from "../ui/progress.jsx";
import {
  Truck,
  Package,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  TrendingUp,
  TrendingDown,
  Loader2,
} from "lucide-react";

const API_BASE_URL = "http://localhost:3000/api";

export const DeliveryOverview = ({ searchTerm, filterRegion }) => {
  const [stats, setStats] = useState({
    totalDeliveries: 0,
    activeDeliveries: 0,
    completedToday: 0,
    onTimeRate: 0,
    availableDeliveryBoys: 0,
    busyDeliveryBoys: 0,
    pendingAssignments: 0,
    // Yesterday's data for comparison
    completedYesterday: 0,
    activeDeliveriesYesterday: 0,
    // Percentage changes
    activeDeliveriesChange: 0,
    completedTodayChange: 0,
  });

  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch delivery statistics
  const fetchDeliveryStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/delivery/stats`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching delivery stats:", error);
      setError("Failed to fetch delivery statistics");
    }
  };

  // Fetch recent orders with filters
  const fetchRecentOrders = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("searchTerm", searchTerm);
      if (filterRegion) params.append("filterRegion", filterRegion);
      params.append("limit", "10");

      const response = await fetch(
        `${API_BASE_URL}/delivery/recent-orders?${params}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setRecentOrders(data);
    } catch (error) {
      console.error("Error fetching recent orders:", error);
      setError("Failed to fetch recent orders");
    }
  };

  // Initial data fetch
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        await Promise.all([fetchDeliveryStats(), fetchRecentOrders()]);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Refetch orders when search term or filter region changes
  useEffect(() => {
    if (!loading) {
      fetchRecentOrders();
    }
  }, [searchTerm, filterRegion]);

  // Helper function to format percentage change
  const formatPercentageChange = (change) => {
    if (change === 0) return "No change";
    const sign = change > 0 ? "+" : "";
    return `${sign}${change}% from yesterday`;
  };

  // Helper function to get trend icon and color
  const getTrendInfo = (change) => {
    if (change > 0) {
      return {
        icon: TrendingUp,
        color: "text-green-500",
        textColor: "text-green-600",
      };
    } else if (change < 0) {
      return {
        icon: TrendingDown,
        color: "text-red-500",
        textColor: "text-red-600",
      };
    } else {
      return {
        icon: TrendingUp,
        color: "text-gray-500",
        textColor: "text-gray-600",
      };
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "assigned":
        return "bg-gradient-to-r from-blue-500 to-blue-600 text-white";
      case "in_transit":
        return "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white";
      case "delivered":
        return "bg-gradient-to-r from-green-500 to-green-600 text-white";
      case "pending":
        return "bg-gradient-to-r from-gray-500 to-gray-600 text-white";
      default:
        return "bg-gradient-to-r from-gray-500 to-gray-600 text-white";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "bg-gradient-to-r from-red-500 to-red-600 text-white";
      case "normal":
        return "bg-gradient-to-r from-blue-500 to-blue-600 text-white";
      case "low":
        return "bg-gradient-to-r from-gray-500 to-gray-600 text-white";
      default:
        return "bg-gradient-to-r from-gray-500 to-gray-600 text-white";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-400 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 flex items-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          <span className="ml-3 text-gray-800 font-semibold">
            Loading delivery overview...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-400 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 text-lg font-semibold mb-4">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-3 rounded-lg shadow-lg transform hover:scale-105 transition duration-300"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-400 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h1 className="text-4xl font-bold text-purple-800 mb-2">
            🚚 Delivery Management Dashboard
          </h1>
          <p className="text-gray-600 text-lg">
            Monitor and manage all delivery operations
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl shadow-xl p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 rounded-full p-3">
                <Truck className="h-6 w-6 text-blue-600" />
              </div>
              {(() => {
                const trendInfo = getTrendInfo(stats.activeDeliveriesChange);
                const TrendIcon = trendInfo.icon;
                return <TrendIcon className={`h-5 w-5 ${trendInfo.color}`} />;
              })()}
            </div>
            <div className="text-3xl font-bold text-gray-800 mb-1">
              {stats.activeDeliveries}
            </div>
            <p className="text-sm font-medium text-gray-600 mb-2">
              Active Deliveries
            </p>
            <p
              className={`text-xs font-semibold ${
                getTrendInfo(stats.activeDeliveriesChange).textColor
              }`}
            >
              {formatPercentageChange(stats.activeDeliveriesChange)}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 rounded-full p-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              {(() => {
                const trendInfo = getTrendInfo(stats.completedTodayChange);
                const TrendIcon = trendInfo.icon;
                return <TrendIcon className={`h-5 w-5 ${trendInfo.color}`} />;
              })()}
            </div>
            <div className="text-3xl font-bold text-gray-800 mb-1">
              {stats.completedToday}
            </div>
            <p className="text-sm font-medium text-gray-600 mb-2">
              Completed Today
            </p>
            <p
              className={`text-xs font-semibold ${
                getTrendInfo(stats.completedTodayChange).textColor
              }`}
            >
              {formatPercentageChange(stats.completedTodayChange)}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-yellow-100 rounded-full p-3">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <span className="text-2xl font-bold text-green-600">
                {stats.onTimeRate}%
              </span>
            </div>
            <p className="text-sm font-medium text-gray-600 mb-3">
              On-Time Rate
            </p>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${stats.onTimeRate}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Delivery Performance</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-100 rounded-full p-3">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <span className="text-sm text-gray-500">
                {stats.busyDeliveryBoys} busy
              </span>
            </div>
            <div className="text-3xl font-bold text-gray-800 mb-1">
              {stats.availableDeliveryBoys}
            </div>
            <p className="text-sm font-medium text-gray-600">
              Available Delivery Boys
            </p>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Recent Orders</h2>
            <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
              {stats.pendingAssignments} pending
            </div>
          </div>
          <p className="text-gray-600 mb-6">
            Latest orders requiring attention
          </p>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {recentOrders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg">No recent orders found</p>
              </div>
            ) : (
              recentOrders.map((order) => (
                <div
                  key={order.orderId}
                  className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:shadow-md transition duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="font-bold text-gray-800">
                          {order.orderId}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(
                            order.priority
                          )}`}
                        >
                          {order.priority}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        {order.customerName}
                      </p>
                      <p className="text-xs text-gray-500">{order.address}</p>
                    </div>
                    <div className="text-right space-y-2">
                      <div
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </div>
                      <p className="text-xs text-gray-500">
                        {order.estimatedTime}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
