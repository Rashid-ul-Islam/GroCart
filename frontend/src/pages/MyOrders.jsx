import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Truck,
  MapPin,
  ShoppingBag,
  Search,
  RefreshCw,
  DollarSign,
  Activity,
  X as XIcon,
  Circle,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

const OrderStats = ({ stats }) => {
  const statCards = [
    {
      title: "Total Orders",
      value: stats ? stats.totalOrders : 0,
      icon: Package,
      color: "text-blue-600 bg-blue-50",
    },
    {
      title: "Delivered",
      value: stats ? stats.deliveredOrders : 0,
      icon: CheckCircle,
      color: "text-green-600 bg-green-50",
    },
    {
      title: "Active Orders",
      value: stats ? stats.activeOrders : 0,
      icon: Clock,
      color: "text-yellow-600 bg-yellow-50",
    },
    {
      title: "Total Spent",
      value: `৳${stats ? Number(stats.totalSpent).toFixed(2) : "0.00"}`,
      icon: DollarSign,
      color: "text-purple-600 bg-purple-50",
    },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
      {statCards.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div
            key={idx}
            className="bg-white rounded-xl shadow-lg p-4 border border-gray-200 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-700 mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
              </div>
              <div className={`p-2 rounded-full ${stat.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const StatusFlowChart = ({ orderId, currentStatus }) => {
  const [statusHistory, setStatusHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add comprehensive null checks
  if (!orderId) {
    return null;
  }

  // Define the complete order flow
  const orderFlow = [
    { key: 'confirmed', label: 'Order Confirmed', icon: Package },
    { key: 'preparing', label: 'Preparing', icon: Clock },
    { key: 'assigned', label: 'Assigned to Delivery', icon: Truck },
    { key: 'left_warehouse', label: 'Left Warehouse', icon: MapPin },
    { key: 'out_for_delivery', label: 'Out for Delivery', icon: Truck },
    { key: 'delivered', label: 'Delivered', icon: CheckCircle2 },
  ];

  useEffect(() => {
    if (orderId) {
      fetchStatusHistory();
    }
  }, [orderId]);

  const fetchStatusHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3000/api/status/order/${orderId}/history`);
      if (!response.ok) throw new Error("Failed to fetch status history");
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setStatusHistory(data.data);
      } else {
        setStatusHistory([]);
      }
    } catch (err) {
      console.error("Error fetching status history:", err);
      setStatusHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const getStepStatus = (stepKey) => {
    if (!stepKey || !Array.isArray(statusHistory)) return 'pending';
    
    // Check if this step has been completed based on status history
    const stepCompleted = statusHistory.some(entry => entry && entry.status === stepKey);
    const isCurrentStep = currentStatus === stepKey;
    
    if (stepCompleted || isCurrentStep) {
      return 'completed';
    }
    
    // Check if this step should be active based on current status
    if (!currentStatus) return 'pending';
    
    const currentIndex = orderFlow.findIndex(step => step.key === currentStatus);
    const stepIndex = orderFlow.findIndex(step => step.key === stepKey);
    
    if (currentIndex !== -1 && stepIndex <= currentIndex) {
      return 'completed';
    }
    
    return 'pending';
  };

  const getStepColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500 text-white border-green-500';
      case 'current':
        return 'bg-blue-500 text-white border-blue-500 animate-pulse';
      default:
        return 'bg-gray-200 text-gray-500 border-gray-300';
    }
  };

  const getConnectorColor = (fromStatus, toStatus) => {
    if (fromStatus === 'completed' && (toStatus === 'completed' || toStatus === 'current')) {
      return 'bg-green-500';
    }
    return 'bg-gray-300';
  };

  if (loading) {
    return (
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
          <span className="ml-2 text-gray-600">Loading status...</span>
        </div>
      </div>
    );
  }

  // Don't show flow chart for cancelled orders or null status
  if (!currentStatus || currentStatus === 'cancelled') {
    if (currentStatus === 'cancelled') {
      return (
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <div className="flex items-center gap-2 text-red-600">
            <XCircle className="w-5 h-5" />
            <span className="font-semibold">Order Cancelled</span>
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
        <Activity className="w-4 h-4" />
        Order Progress
      </h4>
      <div className="relative">
        <div className="flex items-center justify-between">
          {orderFlow.map((step, index) => {
            const stepStatus = getStepStatus(step.key);
            const isLastStep = index === orderFlow.length - 1;
            const Icon = step.icon;
            
            return (
              <div key={step.key} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${getStepColor(stepStatus)}`}>
                    {stepStatus === 'completed' ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <span className="text-xs font-medium text-gray-600 mt-2 text-center max-w-20">
                    {step.label}
                  </span>
                  {(() => {
                    const historyEntry = Array.isArray(statusHistory) ? 
                      statusHistory.find(entry => entry && entry.status === step.key) : null;
                    return historyEntry && historyEntry.updated_at ? (
                      <span className="text-xs text-gray-500 mt-1">
                        {new Date(historyEntry.updated_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    ) : null;
                  })()}
                </div>
                {!isLastStep && (
                  <div className="flex-1 h-1 mx-2 rounded">
                    <div className={`h-full rounded transition-all duration-300 ${getConnectorColor(stepStatus, getStepStatus(orderFlow[index + 1].key))}`}></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

function OrderDetailsModal({ order, onClose }) {
  if (!order) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="relative bg-white max-w-lg w-full rounded-3xl shadow-2xl border-t-[9px] border-purple-600 p-0 animate-fadeIn">
        <div className="flex items-center gap-2 absolute -top-8 left-8 bg-gradient-to-br from-purple-600 to-purple-400 border-4 border-white rounded-full shadow-lg p-4">
          <Package className="h-8 w-8 text-white" />
        </div>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-700 hover:text-red-600 focus:outline-none"
        >
          <XIcon className="w-6 h-6" />
        </button>
        <div className="p-8 pt-12">
          <h2 className="text-3xl font-extrabold text-purple-700 mb-3 tracking-tight">
            Order Details
          </h2>
          <p className="text-sm text-gray-400 mb-6">
            Placed on{" "}
            <span className="text-gray-700 font-bold">
              {order.order_date ? new Date(order.order_date).toLocaleString("en-US") : "Date not available"}
            </span>
          </p>
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 font-semibold w-[120px]">Order ID:</span>
              <span className="text-gray-900 font-bold">{order.order_id || "Unknown"}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 font-semibold w-[120px]">Status:</span>
              <span className={`font-bold px-3 py-1 rounded-full text-sm bg-purple-50 text-purple-700 flex items-center gap-2`}>
                {order.status || "Pending"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 font-semibold w-[120px]">Address:</span>
              <span className="text-gray-900">{order.delivery_address || "Address not available"}</span>
            </div>
          </div>
          <div className="mb-2">
            <span className="font-semibold text-gray-600 mb-2 block">Order Items:</span>
            {Array.isArray(order.items) && order.items.length > 0 ? (
              <div className="divide-y divide-gray-100 bg-gray-50 rounded-xl overflow-hidden border border-gray-200">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center px-4 py-2">
                    <div>
                      <div className="font-bold text-gray-900">
                        {item?.name || <i className="text-gray-400">Unknown Item</i>}
                      </div>
                      {item?.category && (
                        <div className="text-xs text-gray-500">{item.category}</div>
                      )}
                    </div>
                    <div className="flex gap-2 items-center">
                      <span className="text-sm font-semibold text-purple-700">
                        × {item?.quantity || 0}
                      </span>
                      <span className="bg-purple-100 text-purple-700 rounded px-2 text-xs font-semibold ml-1">
                        ৳{item?.price || 0}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-400 italic text-center py-3">No items found.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MyOrders() {
  const { user, isLoggedIn } = useAuth();
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
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
    // eslint-disable-next-line
  }, [isLoggedIn, user, activeTab]);

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
      } else {
        setOrders([]);
        setError(data.message || "Failed to fetch orders");
      }
    } catch (err) {
      setOrders([]);
      setError("Failed to fetch orders");
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
    } catch (err) {}
  };

  const getStatusColor = (status) => {
    if (!status) return "text-gray-600 bg-gray-50";
    
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
      case "assigned":
        return "text-orange-600 bg-orange-50";
      case "left_warehouse":
        return "text-indigo-600 bg-indigo-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getStatusIcon = (status) => {
    if (!status) return <Package className="w-5 h-5" />;
    
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
      case "assigned":
        return <Truck className="w-5 h-5" />;
      case "left_warehouse":
        return <MapPin className="w-5 h-5" />;
      default:
        return <Package className="w-5 h-5" />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Date not available";
    
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  // ======= SAFE SEARCH LOGIC (NO UNDEFINED ERROR) =======
  const filteredOrders = orders.filter((order) => {
    // Comprehensive null checks
    if (!order) return false;
    
    const orderIdMatch =
      order.order_id &&
      typeof order.order_id === "string" &&
      order.order_id.toLowerCase().includes(searchQuery.toLowerCase());

    const itemsMatch =
      Array.isArray(order.items) &&
      order.items.some(
        (item) =>
          item &&
          typeof item?.name === "string" &&
          item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

    return orderIdMatch || itemsMatch;
  });

  // ======= END SAFE SEARCH LOGIC =======

  const OrderCard = ({ order }) => {
    // Add comprehensive null checks
    if (!order) {
      return (
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
          <p className="text-gray-500 text-center">Invalid order data</p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-200 overflow-hidden hover:scale-102">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-1">{order.order_id || "Unknown Order"}</h3>
              <p className="text-sm text-gray-600 font-medium">
                {order.order_date ? formatDate(order.order_date) : "Date not available"}
              </p>
            </div>
            <div
              className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 ${getStatusColor(
                order.status
              )}`}
            >
              {getStatusIcon(order.status)}
              {order.status ? order.status.replace("_", " ").toUpperCase() : "PENDING"}
            </div>
          </div>
          <div className="space-y-3 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
              <MapPin className="w-4 h-4 text-purple-600" />
              <span>{order.delivery_address || "Address not available"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
              <ShoppingBag className="w-4 h-4 text-purple-600" />
              <span>{order.items?.length ?? 0} items</span>
            </div>
          </div>
          
          {/* Show status flow chart for active orders */}
          {(activeTab === "active" || activeTab === "all") && order.status && order.status !== "delivered" && order.status !== "cancelled" && (
            <div className="mb-4">
              <StatusFlowChart orderId={order.order_id} currentStatus={order.status} />
            </div>
          )}
          
          <div className="flex gap-3 mt-4">
            <Button
              onClick={() => setSelectedOrder(order)}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg shadow-lg transform hover:scale-105 transition duration-300 font-bold flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              View Details
            </Button>
          </div>
        </div>
      </div>
    );
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
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-purple-800 mb-2">
                📦 My Orders
              </h1>
              <p className="text-gray-600 text-lg font-medium">
                Track and manage your orders
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 mb-6">
            <div className="xl:col-span-3 space-y-6">
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  📊 Order Statistics
                </h3>
                <OrderStats stats={orderStats} />
              </div>
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
                  <div className="flex gap-3 flex-wrap">
                    {[
                      { key: "all", label: "All Orders", icon: Package },
                      { key: "completed", label: "Completed", icon: CheckCircle },
                      { key: "cancelled", label: "Cancelled", icon: XCircle },
                    ].map((tab) => {
                      const Icon = tab.icon;
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
                          <Icon className="w-4 h-4" />
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex gap-4 items-center">
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
          {selectedOrder && (
            <OrderDetailsModal
              order={selectedOrder}
              onClose={() => setSelectedOrder(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
