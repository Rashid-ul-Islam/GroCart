import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Star,
  MessageSquare,
  Calendar,
  MapPin,
  DollarSign,
  Search,
  Filter,
  ArrowUpDown,
  Eye,
  Download,
  RefreshCw,
  AlertCircle,
  Heart,
  ThumbsUp,
  Award,
  User,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Tabs } from "../components/ui/tabs";
import { Select } from "../components/ui/select";
import { Separator } from "../components/ui/separator";
import { useToast } from "../components/ui/toast";
import { OrderCardSkeleton } from "../components/ui/skeleton";
import OrderTracker from "../components/common/OrderTracker";
import OrderStats from "../components/common/OrderStats";
import ReorderButton from "../components/common/ReorderButton";
import MobileFilters from "../components/common/MobileFilters";

// Star Rating Component
const StarRating = ({ rating, onRatingChange, readonly = false }) => {
  return (
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-6 h-6 cursor-pointer transition-colors ${
            star <= rating
              ? "text-yellow-400 fill-yellow-400"
              : "text-gray-300 hover:text-yellow-400"
          } ${readonly ? "cursor-default" : ""}`}
          onClick={() => !readonly && onRatingChange && onRatingChange(star)}
        />
      ))}
    </div>
  );
};

// Order Card Component
const OrderCard = ({
  order,
  handleOrderClick,
  handleReviewClick,
  getStatusIcon,
  getStatusColor,
  formatDate,
  addToast,
}) => (
  <Card className="p-6 hover:shadow-lg transition-all duration-300 border-l-4 border-l-purple-500">
    <div className="flex justify-between items-start mb-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          Order #{order.order_id}
        </h3>
        <p className="text-gray-600 flex items-center">
          <Calendar className="w-4 h-4 mr-1" />
          {formatDate(order.order_date)}
        </p>
      </div>
      <div className="text-right">
        <Badge className={`${getStatusColor(order.status)} mb-2`}>
          <div className="flex items-center space-x-1">
            {getStatusIcon(order.status)}
            <span className="capitalize">{order.status.replace("_", " ")}</span>
          </div>
        </Badge>
        <p className="text-xl font-bold text-purple-600">
          ${order.total_amount.toFixed(2)}
        </p>
      </div>
    </div>

    <div className="space-y-3 mb-4">
      <div className="flex items-center text-gray-600">
        <MapPin className="w-4 h-4 mr-2" />
        <span className="text-sm">{order.delivery_address}</span>
      </div>

      {order.delivery_boy && (
        <div className="flex items-center justify-between">
          <div className="flex items-center text-gray-600">
            <User className="w-4 h-4 mr-2" />
            <span className="text-sm">Delivery: {order.delivery_boy.name}</span>
          </div>
          <div className="flex items-center">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 mr-1" />
            <span className="text-sm font-medium">
              {order.delivery_boy.rating}
            </span>
          </div>
        </div>
      )}
    </div>

    <div className="border-t pt-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">
          Items ({order.items.length})
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleOrderClick(order)}
          className="text-purple-600 hover:text-purple-800"
        >
          <Eye className="w-4 h-4 mr-1" />
          View Details
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {order.items.slice(0, 4).map((item, index) => (
          <div key={index} className="flex items-center space-x-2">
            <img
              src={item.image}
              alt={item.name}
              className="w-8 h-8 rounded object-cover"
            />
            <span className="text-xs text-gray-600 truncate">
              {item.name} x{item.quantity}
            </span>
          </div>
        ))}
        {order.items.length > 4 && (
          <div className="text-xs text-gray-500 flex items-center">
            +{order.items.length - 4} more items
          </div>
        )}
      </div>
    </div>

    {order.status === "delivered" && (
      <div className="border-t pt-4 mt-4">
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleReviewClick(order.delivery_boy, "delivery")}
            className="flex-1"
          >
            <Star className="w-4 h-4 mr-1" />
            Review Delivery
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleOrderClick(order)}
            className="flex-1"
          >
            <MessageSquare className="w-4 h-4 mr-1" />
            Review Products
          </Button>
          <ReorderButton
            order={order}
            onReorder={(items) =>
              addToast(`${items.length} items added to cart!`, "success")
            }
          />
        </div>
      </div>
    )}
  </Card>
);

const MyOrders = () => {
  const { user, isLoggedIn } = useAuth();
  const { addToast, ToastComponent } = useToast();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");
  const [sortBy, setSortBy] = useState("date_desc");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewType, setReviewType] = useState("product"); // 'product' or 'delivery'
  const [selectedReviewItem, setSelectedReviewItem] = useState(null);
  const [reviewData, setReviewData] = useState({
    rating: 0,
    comment: "",
    would_recommend: false,
  });

  // Mock data for demonstration - replace with actual API calls
  const mockOrders = [
    {
      order_id: "ORD-2024-001",
      order_date: "2024-07-08T10:30:00Z",
      status: "delivered",
      total_amount: 125.5,
      delivery_address: "123 Main St, Downtown",
      delivery_boy: {
        name: "John Doe",
        phone: "+1234567890",
        rating: 4.8,
      },
      estimated_delivery: "2024-07-08T14:30:00Z",
      actual_delivery: "2024-07-08T14:15:00Z",
      items: [
        {
          product_id: 1,
          name: "Fresh Apples",
          quantity: 5,
          price: 25.0,
          image: "/api/placeholder/80/80",
          has_review: false,
        },
        {
          product_id: 2,
          name: "Organic Milk",
          quantity: 2,
          price: 8.5,
          image: "/api/placeholder/80/80",
          has_review: true,
        },
      ],
      payment_method: "Credit Card",
      tracking_number: "TRK123456789",
    },
    {
      order_id: "ORD-2024-002",
      order_date: "2024-07-09T15:20:00Z",
      status: "in_transit",
      total_amount: 89.75,
      delivery_address: "456 Oak Ave, Uptown",
      delivery_boy: {
        name: "Jane Smith",
        phone: "+1234567891",
        rating: 4.9,
      },
      estimated_delivery: "2024-07-10T16:00:00Z",
      items: [
        {
          product_id: 3,
          name: "Whole Wheat Bread",
          quantity: 3,
          price: 12.0,
          image: "/api/placeholder/80/80",
          has_review: false,
        },
      ],
      payment_method: "PayPal",
      tracking_number: "TRK123456790",
    },
    {
      order_id: "ORD-2024-003",
      order_date: "2024-07-05T09:15:00Z",
      status: "cancelled",
      total_amount: 45.3,
      delivery_address: "789 Pine St, Suburbs",
      cancellation_reason: "Item out of stock",
      items: [
        {
          product_id: 4,
          name: "Premium Coffee",
          quantity: 1,
          price: 45.3,
          image: "/api/placeholder/80/80",
          has_review: false,
        },
      ],
      payment_method: "Credit Card",
    },
  ];

  useEffect(() => {
    if (isLoggedIn && user) {
      fetchOrders();
    }
  }, [isLoggedIn, user]);

  useEffect(() => {
    filterAndSortOrders();
  }, [orders, searchTerm, selectedTab, sortBy]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // Replace with actual API call
      // const response = await fetch(`/api/orders/user/${user.user_id}`, {
      //   headers: {
      //     'Authorization': `Bearer ${localStorage.getItem('token')}`
      //   }
      // });
      // const data = await response.json();

      // For now, using mock data
      setTimeout(() => {
        setOrders(mockOrders);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setLoading(false);
    }
  };

  const filterAndSortOrders = () => {
    let filtered = orders.filter((order) => {
      // Search filter
      const searchMatch =
        searchTerm === "" ||
        order.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.items.some((item) =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

      // Tab filter
      let tabMatch = true;
      switch (selectedTab) {
        case "pending":
          tabMatch = ["pending", "confirmed", "preparing"].includes(
            order.status
          );
          break;
        case "in_transit":
          tabMatch = order.status === "in_transit";
          break;
        case "delivered":
          tabMatch = order.status === "delivered";
          break;
        case "cancelled":
          tabMatch = order.status === "cancelled";
          break;
        default:
          tabMatch = true;
      }

      return searchMatch && tabMatch;
    });

    // Sort orders
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date_desc":
          return new Date(b.order_date) - new Date(a.order_date);
        case "date_asc":
          return new Date(a.order_date) - new Date(b.order_date);
        case "amount_desc":
          return b.total_amount - a.total_amount;
        case "amount_asc":
          return a.total_amount - b.total_amount;
        default:
          return 0;
      }
    });

    setFilteredOrders(filtered);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
      case "confirmed":
      case "preparing":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case "in_transit":
        return <Truck className="w-5 h-5 text-blue-500" />;
      case "delivered":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "cancelled":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Package className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
      case "confirmed":
      case "preparing":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "in_transit":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "delivered":
        return "bg-green-100 text-green-800 border-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
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

  const handleOrderClick = (order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const handleReviewClick = (item, type) => {
    setSelectedReviewItem(item);
    setReviewType(type);
    setReviewData({ rating: 0, comment: "", would_recommend: false });
    setShowReviewModal(true);
  };

  const submitReview = async () => {
    try {
      // Replace with actual API call
      console.log("Submitting review:", {
        type: reviewType,
        item: selectedReviewItem,
        review: reviewData,
      });

      // Update the item's review status
      if (reviewType === "product") {
        const updatedOrders = orders.map((order) => {
          if (order.order_id === selectedOrder.order_id) {
            const updatedItems = order.items.map((item) => {
              if (item.product_id === selectedReviewItem.product_id) {
                return { ...item, has_review: true };
              }
              return item;
            });
            return { ...order, items: updatedItems };
          }
          return order;
        });
        setOrders(updatedOrders);
      }

      setShowReviewModal(false);
      setSelectedReviewItem(null);
      addToast(
        `${
          reviewType === "product" ? "Product" : "Delivery"
        } review submitted successfully!`,
        "success"
      );
    } catch (error) {
      console.error("Error submitting review:", error);
      addToast("Failed to submit review. Please try again.", "error");
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-yellow-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-purple-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Login Required
          </h2>
          <p className="text-gray-600 mb-4">
            Please log in to view your order history.
          </p>
          <Button className="w-full bg-purple-600 hover:bg-purple-700">
            Go to Login
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-yellow-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Orders</h1>
          <p className="text-gray-600">Track and manage your orders</p>
        </div>

        {/* Order Statistics */}
        {!loading && orders.length > 0 && <OrderStats orders={orders} />}

        {/* Search and Filters */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search orders by ID or product name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={setSortBy} className="w-48">
                <option value="date_desc">Newest First</option>
                <option value="date_asc">Oldest First</option>
                <option value="amount_desc">Highest Amount</option>
                <option value="amount_asc">Lowest Amount</option>
              </Select>

              <Button
                variant="outline"
                onClick={fetchOrders}
                disabled={loading}
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
          </div>
        </Card>

        {/* Mobile Filters */}
        <MobileFilters
          selectedTab={selectedTab}
          setSelectedTab={setSelectedTab}
          sortBy={sortBy}
          setSortBy={setSortBy}
          orderCounts={{
            all: orders.length,
            pending: orders.filter((o) =>
              ["pending", "confirmed", "preparing"].includes(o.status)
            ).length,
            in_transit: orders.filter((o) => o.status === "in_transit").length,
            delivered: orders.filter((o) => o.status === "delivered").length,
            cancelled: orders.filter((o) => o.status === "cancelled").length,
          }}
        />

        {/* Tabs - Desktop */}
        <div className="mb-6 hidden md:block">
          <div className="flex flex-wrap gap-2">
            {[
              { key: "all", label: "All Orders", count: orders.length },
              {
                key: "pending",
                label: "Pending",
                count: orders.filter((o) =>
                  ["pending", "confirmed", "preparing"].includes(o.status)
                ).length,
              },
              {
                key: "in_transit",
                label: "In Transit",
                count: orders.filter((o) => o.status === "in_transit").length,
              },
              {
                key: "delivered",
                label: "Delivered",
                count: orders.filter((o) => o.status === "delivered").length,
              },
              {
                key: "cancelled",
                label: "Cancelled",
                count: orders.filter((o) => o.status === "cancelled").length,
              },
            ].map((tab) => (
              <Button
                key={tab.key}
                variant={selectedTab === tab.key ? "default" : "outline"}
                onClick={() => setSelectedTab(tab.key)}
                className={`${
                  selectedTab === tab.key
                    ? "bg-purple-600 text-white"
                    : "text-purple-600 border-purple-200 hover:bg-purple-50"
                }`}
              >
                {tab.label} ({tab.count})
              </Button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <OrderCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Orders Found
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedTab !== "all"
                ? "Try adjusting your search or filter criteria."
                : "You haven't placed any orders yet."}
            </p>
            <Button className="bg-purple-600 hover:bg-purple-700">
              Start Shopping
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.order_id}
                order={order}
                handleOrderClick={handleOrderClick}
                handleReviewClick={handleReviewClick}
                getStatusIcon={getStatusIcon}
                getStatusColor={getStatusColor}
                formatDate={formatDate}
                addToast={addToast}
              />
            ))}
          </div>
        )}

        {/* Order Details Modal */}
        {showOrderDetails && selectedOrder && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowOrderDetails(false)}
          >
            <div
              className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">
                      Order Details
                    </h2>
                    <p className="text-gray-600">
                      Order #{selectedOrder.order_id}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => setShowOrderDetails(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </Button>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <Card className="p-4">
                    <h3 className="font-semibold mb-3">Order Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Order Date:</span>
                        <span>{formatDate(selectedOrder.order_date)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <Badge className={getStatusColor(selectedOrder.status)}>
                          {selectedOrder.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Amount:</span>
                        <span className="font-semibold">
                          ${selectedOrder.total_amount.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Payment:</span>
                        <span>{selectedOrder.payment_method}</span>
                      </div>
                      {selectedOrder.tracking_number && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tracking:</span>
                          <span className="font-mono text-xs">
                            {selectedOrder.tracking_number}
                          </span>
                        </div>
                      )}
                    </div>
                  </Card>

                  <Card className="p-4">
                    <h3 className="font-semibold mb-3">Delivery Information</h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600">Address:</span>
                        <p className="mt-1">{selectedOrder.delivery_address}</p>
                      </div>
                      {selectedOrder.delivery_boy && (
                        <div>
                          <span className="text-gray-600">
                            Delivery Person:
                          </span>
                          <div className="mt-1 flex items-center justify-between">
                            <span>{selectedOrder.delivery_boy.name}</span>
                            <div className="flex items-center">
                              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 mr-1" />
                              <span>{selectedOrder.delivery_boy.rating}</span>
                            </div>
                          </div>
                        </div>
                      )}
                      {selectedOrder.estimated_delivery && (
                        <div>
                          <span className="text-gray-600">
                            Estimated Delivery:
                          </span>
                          <p className="mt-1">
                            {formatDate(selectedOrder.estimated_delivery)}
                          </p>
                        </div>
                      )}
                      {selectedOrder.actual_delivery && (
                        <div>
                          <span className="text-gray-600">Delivered On:</span>
                          <p className="mt-1 text-green-600 font-medium">
                            {formatDate(selectedOrder.actual_delivery)}
                          </p>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>

                {/* Order Tracking */}
                <Card className="p-6 mb-6">
                  <h3 className="font-semibold mb-4">Order Tracking</h3>
                  <OrderTracker order={selectedOrder} />
                </Card>

                <Card className="p-4">
                  <h3 className="font-semibold mb-4">Order Items</h3>
                  <div className="space-y-4">
                    {selectedOrder.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center space-x-4">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-16 h-16 rounded object-cover"
                          />
                          <div>
                            <h4 className="font-medium">{item.name}</h4>
                            <p className="text-gray-600">
                              Quantity: {item.quantity}
                            </p>
                            <p className="text-purple-600 font-semibold">
                              ${(item.price * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        </div>

                        {selectedOrder.status === "delivered" && (
                          <div className="flex space-x-2">
                            {!item.has_review ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleReviewClick(item, "product")
                                }
                              >
                                <Star className="w-4 h-4 mr-1" />
                                Review
                              </Button>
                            ) : (
                              <Badge className="bg-green-100 text-green-800">
                                Reviewed
                              </Badge>
                            )}
                            <Button size="sm" variant="outline">
                              <Heart className="w-4 h-4 mr-1" />
                              Add to Favorites
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>

                <div className="flex justify-end space-x-2 mt-6">
                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-1" />
                    Download Invoice
                  </Button>
                  {selectedOrder.status === "delivered" && (
                    <>
                      {selectedOrder.delivery_boy && (
                        <Button
                          onClick={() =>
                            handleReviewClick(
                              selectedOrder.delivery_boy,
                              "delivery"
                            )
                          }
                          variant="outline"
                        >
                          <Star className="w-4 h-4 mr-1" />
                          Review Delivery
                        </Button>
                      )}
                      <ReorderButton
                        order={selectedOrder}
                        onReorder={(items) =>
                          addToast(
                            `${items.length} items added to cart!`,
                            "success"
                          )
                        }
                      />
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Review Modal */}
        {showReviewModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowReviewModal(false)}
          >
            <div
              className="bg-white rounded-lg max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    {reviewType === "product"
                      ? "Review Product"
                      : "Review Delivery"}
                  </h2>
                  <Button
                    variant="ghost"
                    onClick={() => setShowReviewModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </Button>
                </div>

                {selectedReviewItem && (
                  <div className="mb-6">
                    {reviewType === "product" ? (
                      <div className="flex items-center space-x-3">
                        <img
                          src={selectedReviewItem.image}
                          alt={selectedReviewItem.name}
                          className="w-12 h-12 rounded object-cover"
                        />
                        <div>
                          <h3 className="font-medium">
                            {selectedReviewItem.name}
                          </h3>
                          <p className="text-gray-600 text-sm">
                            Quantity: {selectedReviewItem.quantity}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="font-medium">
                            {selectedReviewItem.name}
                          </h3>
                          <p className="text-gray-600 text-sm">
                            Delivery Person
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rating
                    </label>
                    <StarRating
                      rating={reviewData.rating}
                      onRatingChange={(rating) =>
                        setReviewData({ ...reviewData, rating })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Comment (Optional)
                    </label>
                    <textarea
                      value={reviewData.comment}
                      onChange={(e) =>
                        setReviewData({
                          ...reviewData,
                          comment: e.target.value,
                        })
                      }
                      placeholder={`Share your experience with this ${reviewType}...`}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {reviewType === "product" && (
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="recommend"
                        checked={reviewData.would_recommend}
                        onChange={(e) =>
                          setReviewData({
                            ...reviewData,
                            would_recommend: e.target.checked,
                          })
                        }
                        className="w-4 h-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="recommend"
                        className="text-sm text-gray-700"
                      >
                        I would recommend this product
                      </label>
                    </div>
                  )}
                </div>

                <div className="flex space-x-2 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setShowReviewModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={submitReview}
                    disabled={reviewData.rating === 0}
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                  >
                    Submit Review
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <ToastComponent />
    </div>
  );
};

export default MyOrders;
