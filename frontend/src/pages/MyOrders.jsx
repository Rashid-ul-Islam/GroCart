// src/pages/MyOrders.jsx
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Star,
  Eye,
  Truck,
  User,
  Calendar,
  MapPin,
  Phone,
  Mail,
  ShoppingBag,
  Filter,
  Search,
  ArrowLeft,
  MessageCircle,
  Award,
  RefreshCw,
  DollarSign,
  Activity,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { TrendingUp, TrendingDown } from "lucide-react";

// OrderStats component - COMPACT VERSION
const OrderStats = ({ orders, stats }) => {
  const statCards = [
    {
      title: "Total Orders",
      value: stats ? stats.totalOrders : 0,
      icon: Package,
      color: "text-blue-600 bg-blue-50",
      trend: null,
    },
    {
      title: "Delivered",
      value: stats ? stats.deliveredOrders : 0,
      icon: CheckCircle,
      color: "text-green-600 bg-green-50",
      trend: null,
    },
    {
      title: "Active Orders",
      value: stats ? stats.activeOrders : 0,
      icon: Clock,
      color: "text-yellow-600 bg-yellow-50",
      trend: null,
    },
    {
      title: "Total Spent",
      value: `৳${stats ? Number(stats.totalSpent).toFixed(2) : "0.00"}`,
      icon: DollarSign,
      color: "text-purple-600 bg-purple-50",
      trend: null,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
      {statCards.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <div
            key={index}
            className="bg-white rounded-xl shadow-lg p-4 border border-gray-200 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-700 mb-1">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
              </div>
              <div className={`p-2 rounded-full ${stat.color}`}>
                <IconComponent className="w-5 h-5" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default function MyOrders() {
  const { user, isLoggedIn } = useAuth();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewType, setReviewType] = useState("");
  const [selectedReviewItem, setSelectedReviewItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orderStats, setOrderStats] = useState({
    totalOrders: 0,
    deliveredOrders: 0,
    activeOrders: 0,
    totalSpent: 0,
  });

  useEffect(() => {
    if (isLoggedIn && user) {
      fetchOrders(activeTab);
      fetchOrderStats();
    }
  }, [isLoggedIn, user, activeTab]);

  useEffect(() => {
    filterOrders();
  }, [orders, searchQuery]);

  const fetchOrders = async (tab) => {
    if (!user || !user.user_id) {
      setError("User not identified. Cannot fetch orders.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    let endpoint = "http://localhost:3000/api/order/user/" + user.user_id;
    if (tab === "active")
      endpoint = "http://localhost:3000/api/order/active/" + user.user_id;
    else if (tab === "completed")
      endpoint = "http://localhost:3000/api/order/completed/" + user.user_id;
    else if (tab === "cancelled")
      endpoint = "http://localhost:3000/api/order/cancelled/" + user.user_id;
    try {
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error("Failed to fetch orders");
      const data = await response.json();
      if (data.success) {
        setOrders(data.data);
        console.log("Fetched orders:", data.data);
      } else {
        setOrders([]);
        setError(data.message || "Failed to fetch orders");
      }
    } catch (err) {
      setOrders([]);
      setError("Failed to fetch orders");
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderStats = async () => {
    if (!user || !user.user_id) return;
    try {
      const response = await fetch(
        `http://localhost:3000/api/order/stats/${user.user_id}`
      );
      if (!response.ok) throw new Error("Failed to fetch order stats");
      const data = await response.json();
      if (data.success) {
        setOrderStats(data.data);
      }
    } catch (err) {
      console.error("Error fetching order stats:", err);
    }
  };

  const filterOrders = () => {
    let filtered = orders;
    if (searchQuery) {
      filtered = filtered.filter(
        (order) =>
          order.order_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (order.items &&
            order.items.some((item) =>
              item.name.toLowerCase().includes(searchQuery.toLowerCase())
            ))
      );
    }
    setFilteredOrders(filtered);
  };

  const handleReorder = async (order) => {
    try {
      const items = order.items.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
      }));

      const orderPayload = {
        user_id: user.user_id,
        items: items,
        address_id: order.reorder_data.address_id,
        payment_method: order.reorder_data.payment_method,
        total_amount: order.reorder_data.total_amount,
        product_total: order.reorder_data.product_total,
        tax_total: order.reorder_data.tax_total,
        shipping_total: order.reorder_data.shipping_total,
        discount_total: order.reorder_data.discount_total,
        coupon_id: order.reorder_data.coupon_id,
      };
      console.log("Reorder payload:", orderPayload);
      const response = await fetch("http://localhost:3000/api/order/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderPayload),
      });

      const result = await response.json();

      if (result.success) {
        alert("Order placed successfully!");
        fetchOrders(activeTab);
      } else {
        alert("Failed to place order: " + result.message);
      }
    } catch (error) {
      console.error("Error reordering:", error);
      alert("Failed to place order. Please try again.");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "delivered":
        return "text-green-600 bg-green-50";
      case "out_for_delivery":
        return "text-blue-600 bg-blue-50";
      case "preparing":
        return "text-yellow-600 bg-yellow-50";
      case "confirmed":
        return "text-purple-600 bg-purple-50";
      case "cancelled":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "delivered":
        return <CheckCircle className="w-5 h-5" />;
      case "out_for_delivery":
        return <Truck className="w-5 h-5" />;
      case "preparing":
        return <Clock className="w-5 h-5" />;
      case "confirmed":
        return <Package className="w-5 h-5" />;
      case "cancelled":
        return <XCircle className="w-5 h-5" />;
      default:
        return <Package className="w-5 h-5" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleReviewClick = (type, item) => {
    setReviewType(type);
    setSelectedReviewItem(item);
    setShowReviewModal(true);
  };

  const OrderCard = ({ order }) => (
    <div className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-200 overflow-hidden hover:scale-102">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">
              {order.order_id}
            </h3>
            <p className="text-sm text-gray-600 font-medium">
              {formatDate(order.order_date)}
            </p>
          </div>
          <div
            className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 ${getStatusColor(
              order.status
            )}`}
          >
            {getStatusIcon(order.status)}
            {order.status.replace("_", " ").toUpperCase()}
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
            <MapPin className="w-4 h-4 text-purple-600" />
            <span>{order.delivery_address}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
            <ShoppingBag className="w-4 h-4 text-purple-600" />
            <span>{order.items.length} items</span>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={() => setSelectedOrder(order)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg shadow-lg transform hover:scale-105 transition duration-300 font-bold flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            View Details
          </Button>
          {(order.status === "payment_received" ||
            order.status === "payment_received") && (
            <Button
              onClick={() => handleReorder(order)}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 rounded-lg shadow-lg transform hover:scale-105 transition duration-300 font-bold flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Reorder
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  // OrderDetailsModal and ReviewModal components remain the same as before
  const OrderDetailsModal = ({ order, onClose }) => {
    return null; // Placeholder - use your existing OrderDetailsModal code
  };

  const ReviewModal = ({ type, item, onClose }) => {
    return null; // Placeholder - use your existing ReviewModal code
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-400 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Please Log In
          </h2>
          <p className="text-gray-600 font-medium">
            You need to be logged in to view your orders.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-400">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-purple-800 mb-2">
                📦 My Orders
              </h1>
              <p className="text-gray-600 text-lg font-medium">Track and manage your orders</p>
            </div>
          </div>

          {/* COMBINED LAYOUT: Stats + Search + Active Orders - NO GAP */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 mb-6">
            {/* Left Side - Combined Stats & Search Section (3/4 width) */}
            <div className="xl:col-span-3 space-y-6">
              {/* Stats Section */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">📊 Order Statistics</h3>
                <OrderStats orders={orders} stats={orderStats} />
              </div>

              {/* Search & Filter Section */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
                  {/* Main Filter Tabs */}
                  <div className="flex gap-3 flex-wrap">
                    {[
                      { key: "all", label: "All Orders", icon: Package },
                      { key: "completed", label: "Completed", icon: CheckCircle },
                      { key: "cancelled", label: "Cancelled", icon: XCircle },
                    ].map((tab) => {
                      const IconComponent = tab.icon;
                      return (
                        <button
                          key={tab.key}
                          onClick={() => setActiveTab(tab.key)}
                          className={`px-6 py-3 rounded-xl text-sm font-bold transition-all duration-200 transform hover:scale-105 flex items-center gap-2 ${
                            activeTab === tab.key
                              ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-xl"
                              : "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300 shadow-lg"
                          }`}
                        >
                          <IconComponent className="w-4 h-4" />
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Search & Refresh */}
                  <div className="flex gap-4 items-center">
                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        type="text"
                        placeholder="Search orders..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-12 pr-4 py-3 h-12 bg-white text-gray-900 border-2 border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-semibold"
                      />
                    </div>

                    {/* Refresh Button */}
                    <Button
                      onClick={() => fetchOrders(activeTab)}
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg shadow-lg transform hover:scale-105 transition duration-300 font-bold flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Refresh
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Active Orders (1/4 width) - COMPACT VERSION */}
            <div className="xl:col-span-1">
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="text-center">
                  <div className="bg-gradient-to-r from-orange-100 to-orange-200 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Activity className="w-8 h-8 text-orange-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Active Orders</h3>
                  <p className="text-gray-600 text-sm mb-4 font-medium">
                    View your ongoing deliveries
                  </p>
                  <div className="text-4xl font-bold text-orange-600 mb-6">
                    {orderStats.activeOrders}
                  </div>
                  <button
                    onClick={() => setActiveTab("active")}
                    className={`w-full px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2 ${
                      activeTab === "active"
                        ? "bg-gradient-to-r from-orange-600 to-orange-700 text-white shadow-xl"
                        : "bg-gradient-to-r from-orange-100 to-orange-200 text-orange-700 hover:from-orange-200 hover:to-orange-300 shadow-lg"
                    }`}
                  >
                    <Activity className="w-4 h-4" />
                    View Active
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Orders List */}
          {loading ? (
            <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-6"></div>
              <p className="text-gray-600 font-semibold text-lg">Loading your orders...</p>
            </div>
          ) : error ? (
            <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
              <p className="text-red-600 font-semibold text-lg mb-4">{error}</p>
              <Button 
                onClick={() => fetchOrders(activeTab)} 
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-8 py-4 rounded-lg shadow-lg transform hover:scale-105 transition duration-300 font-bold"
              >
                Try Again
              </Button>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-6" />
              <p className="text-gray-600 font-semibold text-lg">
                {searchQuery
                  ? "No orders found matching your search"
                  : "No orders found"}
              </p>
            </div>
          ) : (
            <div className="grid gap-8">
              {filteredOrders.map((order) => (
                <OrderCard key={order.order_id} order={order} />
              ))}
            </div>
          )}

          {/* Order Details Modal */}
          {selectedOrder && (
            <OrderDetailsModal
              order={selectedOrder}
              onClose={() => setSelectedOrder(null)}
            />
          )}

          {/* Review Modal */}
          {showReviewModal && (
            <ReviewModal
              type={reviewType}
              item={selectedReviewItem}
              onClose={() => {
                setShowReviewModal(false);
                setSelectedReviewItem(null);
                setReviewType("");
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
