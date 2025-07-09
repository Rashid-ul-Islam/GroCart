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
  DollarSign
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { TrendingUp, TrendingDown } from "lucide-react";

// Add this component before the main MyOrders component
const OrderStats = ({ orders }) => {
  const calculateStats = () => {
    const totalOrders = orders.length;
    const deliveredOrders = orders.filter(order => order.status === 'delivered').length;
    const activeOrders = orders.filter(order => 
      ['confirmed', 'preparing', 'out_for_delivery'].includes(order.status)
    ).length;
    const totalSpent = orders.reduce((sum, order) => sum + order.total_amount, 0);
    
    // Calculate delivery rate
    const deliveryRate = totalOrders > 0 ? (deliveredOrders / totalOrders * 100) : 0;
    
    return {
      totalOrders,
      deliveredOrders,
      activeOrders,
      totalSpent,
      deliveryRate
    };
  };

  const stats = calculateStats();

  const statCards = [
    {
      title: "Total Orders",
      value: stats.totalOrders,
      icon: Package,
      color: "text-blue-600 bg-blue-50",
      trend: null
    },
    {
      title: "Delivered",
      value: stats.deliveredOrders,
      icon: CheckCircle,
      color: "text-green-600 bg-green-50",
      trend: null
    },
    {
      title: "Active Orders",
      value: stats.activeOrders,
      icon: Clock,
      color: "text-yellow-600 bg-yellow-50",
      trend: null
    },
    {
      title: "Total Spent",
      value: `৳${stats.totalSpent.toFixed(2)}`,
      icon: DollarSign,
      color: "text-purple-600 bg-purple-50",
      trend: null
    },
    {
      title: "Delivery Rate",
      value: `${stats.deliveryRate.toFixed(1)}%`,
      icon: stats.deliveryRate >= 80 ? TrendingUp : TrendingDown,
      color: stats.deliveryRate >= 80 ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50",
      trend: stats.deliveryRate >= 80 ? "positive" : "negative"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
      {statCards.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <div key={index} className="bg-white rounded-lg border p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stat.value}
                </p>
              </div>
              <div className={`p-3 rounded-full ${stat.color}`}>
                <IconComponent className="w-6 h-6" />
              </div>
            </div>
            {stat.trend && (
              <div className="mt-4 flex items-center">
                <span className={`text-sm font-medium ${
                  stat.trend === 'positive' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.trend === 'positive' ? '↗' : '↘'} 
                  {stat.trend === 'positive' ? 'Good' : 'Needs Improvement'}
                </span>
              </div>
            )}
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
  const [reviewType, setReviewType] = useState(""); // 'product' or 'delivery'
  const [selectedReviewItem, setSelectedReviewItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mock data for demonstration
  const mockOrders = [
    {
      order_id: "ORD-2024-001",
      order_date: "2024-12-15T10:30:00Z",
      status: "delivered",
      total_amount: 156.75,
      delivery_address: "123 Main Street, Dhaka 1207",
      delivery_boy: {
        name: "Ahmed Rahman",
        phone: "+8801712345678",
        email: "ahmed@grocart.com",
        rating: 4.8,
        total_deliveries: 1250,
      },
      items: [
        {
          product_id: "prod_001",
          name: "Fresh Bananas",
          quantity: 2,
          price: 45.50,
          image: "/api/placeholder/80/80",
          category: "Fruits",
        },
        {
          product_id: "prod_002",
          name: "Organic Milk",
          quantity: 1,
          price: 89.00,
          image: "/api/placeholder/80/80",
          category: "Dairy",
        },
        {
          product_id: "prod_003",
          name: "Whole Wheat Bread",
          quantity: 1,
          price: 22.25,
          image: "/api/placeholder/80/80",
          category: "Bakery",
        },
      ],
      tracking_info: {
        ordered_at: "2024-12-15T10:30:00Z",
        confirmed_at: "2024-12-15T10:45:00Z",
        preparing_at: "2024-12-15T11:00:00Z",
        out_for_delivery_at: "2024-12-15T14:30:00Z",
        delivered_at: "2024-12-15T15:15:00Z",
      },
      estimated_delivery: "2024-12-15T16:00:00Z",
      can_review_products: true,
      can_review_delivery: true,
    },
    {
      order_id: "ORD-2024-002",
      order_date: "2024-12-20T14:20:00Z",
      status: "out_for_delivery",
      total_amount: 234.50,
      delivery_address: "456 Oak Avenue, Dhaka 1208",
      delivery_boy: {
        name: "Karim Hassan",
        phone: "+8801798765432",
        email: "karim@grocart.com",
        rating: 4.9,
        total_deliveries: 890,
      },
      items: [
        {
          product_id: "prod_004",
          name: "Basmati Rice (5kg)",
          quantity: 1,
          price: 180.00,
          image: "/api/placeholder/80/80",
          category: "Grains",
        },
        {
          product_id: "prod_005",
          name: "Fresh Chicken",
          quantity: 1,
          price: 54.50,
          image: "/api/placeholder/80/80",
          category: "Meat",
        },
      ],
      tracking_info: {
        ordered_at: "2024-12-20T14:20:00Z",
        confirmed_at: "2024-12-20T14:35:00Z",
        preparing_at: "2024-12-20T15:00:00Z",
        out_for_delivery_at: "2024-12-20T17:45:00Z",
      },
      estimated_delivery: "2024-12-20T18:30:00Z",
      can_review_products: false,
      can_review_delivery: false,
    },
    {
      order_id: "ORD-2024-003",
      order_date: "2024-12-22T09:15:00Z",
      status: "preparing",
      total_amount: 89.25,
      delivery_address: "789 Pine Road, Dhaka 1209",
      items: [
        {
          product_id: "prod_006",
          name: "Greek Yogurt",
          quantity: 2,
          price: 65.00,
          image: "/api/placeholder/80/80",
          category: "Dairy",
        },
        {
          product_id: "prod_007",
          name: "Honey",
          quantity: 1,
          price: 24.25,
          image: "/api/placeholder/80/80",
          category: "Pantry",
        },
      ],
      tracking_info: {
        ordered_at: "2024-12-22T09:15:00Z",
        confirmed_at: "2024-12-22T09:30:00Z",
        preparing_at: "2024-12-22T10:00:00Z",
      },
      estimated_delivery: "2024-12-22T12:00:00Z",
      can_review_products: false,
      can_review_delivery: false,
    },
  ];

  useEffect(() => {
    if (isLoggedIn) {
      fetchOrders();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    filterOrders();
  }, [orders, activeTab, searchQuery]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setOrders(mockOrders);
      setError(null);
    } catch (err) {
      setError("Failed to fetch orders");
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;

    // Filter by status
    if (activeTab !== "all") {
      filtered = filtered.filter(order => {
        switch (activeTab) {
          case "completed":
            return order.status === "delivered";
          case "active":
            return ["confirmed", "preparing", "out_for_delivery"].includes(order.status);
          case "cancelled":
            return order.status === "cancelled";
          default:
            return true;
        }
      });
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(order =>
        order.order_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.items.some(item => 
          item.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    setFilteredOrders(filtered);
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
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border border-purple-100 overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-purple-900 mb-1">
              {order.order_id}
            </h3>
            <p className="text-sm text-gray-600">
              {formatDate(order.order_date)}
            </p>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${getStatusColor(order.status)}`}>
            {getStatusIcon(order.status)}
            {order.status.replace("_", " ").toUpperCase()}
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4" />
            <span>{order.delivery_address}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <ShoppingBag className="w-4 h-4" />
            <span>{order.items.length} items</span>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="text-xl font-bold text-purple-900">
            ৳{order.total_amount.toFixed(2)}
          </div>
          <Button
            onClick={() => setSelectedOrder(order)}
            variant="outline"
            className="text-purple-600 border-purple-300 hover:bg-purple-50"
          >
            <Eye className="w-4 h-4 mr-2" />
            View Details
          </Button>
        </div>
      </div>
    </div>
  );

  const OrderDetailsModal = ({ order, onClose }) => {
    const [activeDetailsTab, setActiveDetailsTab] = useState("items");

    const trackingSteps = [
      { key: "ordered_at", label: "Order Placed", icon: <Package className="w-5 h-5" /> },
      { key: "confirmed_at", label: "Confirmed", icon: <CheckCircle className="w-5 h-5" /> },
      { key: "preparing_at", label: "Preparing", icon: <Clock className="w-5 h-5" /> },
      { key: "out_for_delivery_at", label: "Out for Delivery", icon: <Truck className="w-5 h-5" /> },
      { key: "delivered_at", label: "Delivered", icon: <Award className="w-5 h-5" /> },
    ];

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-purple-100 p-6 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-purple-900">Order Details</h2>
            <Button onClick={onClose} variant="ghost" size="sm">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gradient-to-r from-purple-50 to-yellow-50 rounded-xl p-4">
                <h3 className="font-semibold text-purple-900 mb-2">Order Information</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Order ID:</strong> {order.order_id}</p>
                  <p><strong>Date:</strong> {formatDate(order.order_date)}</p>
                  <p><strong>Status:</strong> 
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getStatusColor(order.status)}`}>
                      {order.status.replace("_", " ").toUpperCase()}
                    </span>
                  </p>
                  <p><strong>Total:</strong> ৳{order.total_amount.toFixed(2)}</p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4">
                <h3 className="font-semibold text-purple-900 mb-2">Delivery Information</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Address:</strong> {order.delivery_address}</p>
                  <p><strong>Estimated Delivery:</strong> {formatDate(order.estimated_delivery)}</p>
                  {order.delivery_boy && (
                    <div className="mt-3 p-3 bg-white rounded-lg border">
                      <p className="font-medium text-purple-900">Delivery Boy</p>
                      <p className="text-sm">{order.delivery_boy.name}</p>
                      <p className="text-sm text-gray-600">{order.delivery_boy.phone}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm">{order.delivery_boy.rating}</span>
                        <span className="text-xs text-gray-500">({order.delivery_boy.total_deliveries} deliveries)</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex border-b border-purple-100 mb-6">
              <button
                onClick={() => setActiveDetailsTab("items")}
                className={`px-4 py-2 font-medium ${activeDetailsTab === "items" ? "text-purple-600 border-b-2 border-purple-600" : "text-gray-600"}`}
              >
                Items ({order.items.length})
              </button>
              <button
                onClick={() => setActiveDetailsTab("tracking")}
                className={`px-4 py-2 font-medium ${activeDetailsTab === "tracking" ? "text-purple-600 border-b-2 border-purple-600" : "text-gray-600"}`}
              >
                Order Tracking
              </button>
            </div>

            {activeDetailsTab === "items" && (
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-purple-900">{item.name}</h4>
                      <p className="text-sm text-gray-600">{item.category}</p>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-purple-900">৳{item.price.toFixed(2)}</p>
                      {order.can_review_products && order.status === "delivered" && (
                        <Button
                          onClick={() => handleReviewClick("product", item)}
                          variant="outline"
                          size="sm"
                          className="mt-2 text-xs"
                        >
                          <Star className="w-3 h-3 mr-1" />
                          Review
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeDetailsTab === "tracking" && (
              <div className="space-y-6">
                <div className="relative">
                  {trackingSteps.map((step, index) => {
                    const isCompleted = order.tracking_info[step.key];
                    const isActive = index === trackingSteps.findIndex(s => !order.tracking_info[s.key]);
                    
                    return (
                      <div key={step.key} className="flex items-center gap-4 mb-6">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isCompleted ? "bg-green-500 text-white" : 
                          isActive ? "bg-purple-500 text-white" : 
                          "bg-gray-200 text-gray-500"
                        }`}>
                          {step.icon}
                        </div>
                        <div className="flex-1">
                          <h4 className={`font-medium ${isCompleted ? "text-green-700" : isActive ? "text-purple-700" : "text-gray-500"}`}>
                            {step.label}
                          </h4>
                          {isCompleted && (
                            <p className="text-sm text-gray-600">
                              {formatDate(order.tracking_info[step.key])}
                            </p>
                          )}
                        </div>
                        {isActive && (
                          <div className="animate-pulse">
                            <RefreshCw className="w-5 h-5 text-purple-500" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {order.can_review_delivery && order.status === "delivered" && (
                  <div className="bg-purple-50 rounded-xl p-4">
                    <h4 className="font-medium text-purple-900 mb-2">Rate Your Experience</h4>
                    <p className="text-sm text-gray-600 mb-3">Help us improve by rating your delivery experience</p>
                    <Button
                      onClick={() => handleReviewClick("delivery", order.delivery_boy)}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      <Star className="w-4 h-4 mr-2" />
                      Rate Delivery
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const ReviewModal = ({ type, item, onClose }) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
      e.preventDefault();
      setSubmitting(true);
      
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log("Review submitted:", {
          type,
          item_id: type === "product" ? item.product_id : item.name,
          rating,
          comment,
        });
        
        onClose();
      } catch (error) {
        console.error("Error submitting review:", error);
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl max-w-md w-full p-6">
          <h3 className="text-xl font-bold text-purple-900 mb-4">
            {type === "product" ? "Review Product" : "Review Delivery"}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
              {type === "product" ? (
                <>
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-12 h-12 object-cover rounded-lg"
                  />
                  <div>
                    <h4 className="font-medium text-purple-900">{item.name}</h4>
                    <p className="text-sm text-gray-600">{item.category}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <User className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-purple-900">{item.name}</h4>
                    <p className="text-sm text-gray-600">Delivery Boy</p>
                  </div>
                </>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-900 mb-2">
                Rating
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`w-8 h-8 ${
                      star <= rating ? "text-yellow-400" : "text-gray-300"
                    } hover:text-yellow-400 transition-colors`}
                  >
                    <Star className="w-full h-full fill-current" />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-900 mb-2">
                Comment (Optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder={`Share your experience with ${type === "product" ? "this product" : "the delivery"}...`}
              />
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={rating === 0 || submitting}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
              >
                {submitting ? "Submitting..." : "Submit Review"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-purple-900 mb-4">Please Log In</h2>
          <p className="text-gray-600">You need to be logged in to view your orders.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-yellow-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-purple-900 mb-2">My Orders</h1>
            <p className="text-gray-600">Track and manage your orders</p>
          </div>
            <div className="bg-white rounded-xl shadow-md p-6 mb-8">
                <OrderStats orders={orders} />className="bg-white rounded-xl shadow-md p-6 mb-8
            </div>
          {/* Filters and Search */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex gap-2 flex-wrap">
                {[
                  { key: "all", label: "All Orders" },
                  { key: "active", label: "Active" },
                  { key: "completed", label: "Completed" },
                  { key: "cancelled", label: "Cancelled" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      activeTab === tab.key
                        ? "bg-purple-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Search orders..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <Button
                  onClick={fetchOrders}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </Button>
              </div>
            </div>
          </div>

          {/* Orders List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your orders...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600">{error}</p>
              <Button onClick={fetchOrders} className="mt-4">
                Try Again
              </Button>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {searchQuery ? "No orders found matching your search" : "No orders found"}
              </p>
            </div>
          ) : (
            <div className="grid gap-6">
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