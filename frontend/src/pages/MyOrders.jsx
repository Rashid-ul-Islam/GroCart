import { useState, useEffect, useCallback } from "react";
import React from "react";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../hooks/useNotification";
import Notification from "../components/ui/Notification";
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
  Star,
  MessageSquare,
  RotateCcw,
  Ban,
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
                <p className="text-xs font-bold text-gray-700 mb-1">
                  {stat.title}
                </p>
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

// Helper function to get step color based on status
const getStepColor = (status) => {
  switch (status) {
    case "completed":
      return "bg-green-500 border-green-500 text-white";
    case "current":
      return "bg-blue-500 border-blue-500 text-white";
    case "pending":
      return "bg-gray-200 border-gray-300 text-gray-500";
    default:
      return "bg-gray-200 border-gray-300 text-gray-500";
  }
};

const StatusFlowChart = ({ orderId, currentStatus, paymentMethod }) => {
  const [statusHistory, setStatusHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add comprehensive null checks
  if (!orderId) {
    return null;
  }

  // Define different order flows based on payment method
  const getOrderFlow = (paymentMethod) => {
    const baseFlow = [
      { key: "pending", label: "Order Created", icon: Package },
      { key: "confirmed", label: "Order Confirmed", icon: CheckCircle2 },
      { key: "assigned", label: "Assigned to Delivery", icon: Truck },
      { key: "left_warehouse", label: "Left Warehouse", icon: MapPin },
      { key: "in_transit", label: "Out for Delivery", icon: Truck },
      { key: "delivery_completed", label: "Delivered", icon: CheckCircle2 },
    ];

    if (paymentMethod && paymentMethod.toLowerCase() === "bkash") {
      // For bKash: Payment first, then delivery flow
      return [
        {
          key: "payment_received",
          label: "Payment Received",
          icon: DollarSign,
        },
        ...baseFlow.slice(1), // Skip 'pending' for bKash since payment is first
        { key: "delivery_completed", label: "Delivered", icon: CheckCircle2 },
      ];
    } else {
      // For COD: Delivery flow first, then payment
      return [
        ...baseFlow,
        {
          key: "payment_received",
          label: "Payment Received",
          icon: DollarSign,
        },
      ];
    }
  };

  const orderFlow = getOrderFlow(paymentMethod);

  useEffect(() => {
    if (orderId) {
      fetchStatusHistory();
    }
  }, [orderId]);

  const fetchStatusHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:3000/api/status/order/${orderId}/history`
      );
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
    if (!stepKey || !Array.isArray(statusHistory)) return "pending";

    // Check if this step has been completed based on status history
    const stepCompleted = statusHistory.some(
      (entry) => entry && entry.status === stepKey
    );

    if (stepCompleted) {
      return "completed";
    }

    // Check if this step should be active based on current status
    if (!currentStatus) return "pending";

    // For the current step, mark as current/active
    if (currentStatus === stepKey) {
      return "current";
    }

    // Check if this step should be completed based on the order flow and current status
    const currentIndex = orderFlow.findIndex(
      (step) => step.key === currentStatus
    );
    const stepIndex = orderFlow.findIndex((step) => step.key === stepKey);

    if (currentIndex !== -1 && stepIndex !== -1 && stepIndex < currentIndex) {
      return "completed";
    }

    return "pending";
  };

  const getStepColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-500 text-white border-green-500";
      case "current":
        return "bg-blue-500 text-white border-blue-500 animate-pulse";
      default:
        return "bg-gray-200 text-gray-500 border-gray-300";
    }
  };

  const getConnectorColor = (fromStatus, toStatus) => {
    if (
      fromStatus === "completed" &&
      (toStatus === "completed" || toStatus === "current")
    ) {
      return "bg-green-500";
    }
    return "bg-gray-300";
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
  if (!currentStatus || currentStatus === "cancelled") {
    if (currentStatus === "cancelled") {
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
                  <div
                    className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${getStepColor(
                      stepStatus
                    )}`}
                  >
                    {stepStatus === "completed" ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : stepStatus === "current" ? (
                      <Icon className="w-5 h-5 animate-pulse" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium mt-2 text-center max-w-20 transition-colors duration-300 ${
                      stepStatus === "completed"
                        ? "text-green-600"
                        : stepStatus === "current"
                        ? "text-blue-600"
                        : "text-gray-600"
                    }`}
                  >
                    {step.label}
                  </span>
                  {(() => {
                    const historyEntry = Array.isArray(statusHistory)
                      ? statusHistory.find(
                          (entry) => entry && entry.status === step.key
                        )
                      : null;
                    return historyEntry && historyEntry.updated_at ? (
                      <span className="text-xs text-gray-500 mt-1">
                        {new Date(historyEntry.updated_at).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </span>
                    ) : null;
                  })()}
                </div>
                {!isLastStep && (
                  <div className="flex-1 h-1 mx-2 rounded">
                    <div
                      className={`h-full rounded transition-all duration-300 ${getConnectorColor(
                        stepStatus,
                        getStepStatus(orderFlow[index + 1].key)
                      )}`}
                    ></div>
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

function DeliveryReviewModal({ order, onClose }) {
  const { user } = useAuth();
  const { showSuccess, showError, showWarning } = useNotification();
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!order) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      showWarning("Rating Required", "Please select a rating");
      return;
    }

    if (!user || !user.user_id) {
      showError("Authentication Error", "User not authenticated");
      return;
    }

    setSubmitting(true);
    try {
      // Submit delivery review to DeliveryPerformance table
      const response = await fetch(
        `http://localhost:3000/api/reviews/delivery?user_id=${user.user_id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            order_id: order.order_id,
            rating,
            feedback,
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        showSuccess("Review Submitted", "Delivery review submitted successfully!");
        onClose();
        // Refresh the page to update button states
        window.location.reload();
      } else {
        throw new Error(result.message || "Failed to submit review");
      }
    } catch (error) {
      console.error("Error submitting delivery review:", error);
      showError("Review Failed", error.message || "Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="relative bg-white max-w-md w-full rounded-3xl shadow-2xl border-t-[9px] border-green-600 p-0 animate-fadeIn">
        <div className="flex items-center gap-2 absolute -top-8 left-8 bg-gradient-to-br from-green-600 to-green-400 border-4 border-white rounded-full shadow-lg p-4">
          <Truck className="h-8 w-8 text-white" />
        </div>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-green-50 hover:bg-green-100 text-green-700 hover:text-red-600 focus:outline-none"
        >
          <XIcon className="w-6 h-6" />
        </button>
        <div className="p-8 pt-12">
          <h2 className="text-3xl font-extrabold text-green-700 mb-3 tracking-tight">
            Delivery Review
          </h2>
          <p className="text-sm text-gray-400 mb-6">
            Rate your delivery experience for Order {order.order_id}
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rate the delivery service:
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`p-1 ${
                      star <= rating ? "text-yellow-400" : "text-gray-300"
                    } hover:text-yellow-400 transition-colors`}
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= rating ? "fill-current" : ""
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Feedback (optional):
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                placeholder="Share your delivery experience..."
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-bold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 rounded-lg font-bold"
              >
                {submitting ? "Submitting..." : "Submit Review"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function ProductReviewModal({ order, onClose }) {
  const { user } = useAuth();
  const { showSuccess, showError, showWarning } = useNotification();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!order) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct) {
      showWarning("Product Required", "Please select a product to review");
      return;
    }
    if (rating === 0) {
      showWarning("Rating Required", "Please select a rating");
      return;
    }

    if (!user || !user.user_id) {
      showError("Authentication Error", "User not authenticated");
      return;
    }

    setSubmitting(true);
    try {
      // Submit product review
      const response = await fetch("http://localhost:3000/api/reviews/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reviewType: "product",
          itemId: selectedProduct.product_id,
          orderId: order.order_id,
          userId: user.user_id,
          rating,
          comment,
        }),
      });

      const result = await response.json();

      if (result.success) {
        showSuccess("Review Submitted", "Product review submitted successfully!");
        onClose();
        // Refresh the page to update button states
        window.location.reload();
      } else {
        throw new Error(result.message || "Failed to submit review");
      }
    } catch (error) {
      console.error("Error submitting product review:", error);
      showError("Review Failed", error.message || "Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="relative bg-white max-w-md w-full rounded-3xl shadow-2xl border-t-[9px] border-yellow-600 p-0 animate-fadeIn">
        <div className="flex items-center gap-2 absolute -top-8 left-8 bg-gradient-to-br from-yellow-600 to-yellow-400 border-4 border-white rounded-full shadow-lg p-4">
          <Star className="h-8 w-8 text-white" />
        </div>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-yellow-50 hover:bg-yellow-100 text-yellow-700 hover:text-red-600 focus:outline-none"
        >
          <XIcon className="w-6 h-6" />
        </button>
        <div className="p-8 pt-12">
          <h2 className="text-3xl font-extrabold text-yellow-700 mb-3 tracking-tight">
            Product Review
          </h2>
          <p className="text-sm text-gray-700 mb-6">
            Rate the products from Order {order.order_id}
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select product to review:
              </label>
              <select
                value={selectedProduct?.product_id || ""}
                onChange={(e) => {
                  const product = order.items?.find(
                    (item) => item.product_id === parseInt(e.target.value)
                  );
                  setSelectedProduct(product);
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white text-gray-900"
              >
                <option value="" className="text-gray-700">Choose a product...</option>
                {order.items?.map((item) => (
                  <option key={item.product_id} value={item.product_id} className="text-gray-900">
                    {item.product_name || "Unknown Product"}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rate this product:
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`p-1 ${
                      star <= rating ? "text-yellow-400" : "text-gray-300"
                    } hover:text-yellow-400 transition-colors`}
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= rating ? "fill-current" : ""
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Review comments (optional):
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white text-gray-900"
                placeholder="Tell us about this product..."
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-bold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white px-6 py-3 rounded-lg font-bold"
              >
                {submitting ? "Submitting..." : "Submit Review"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function ReturnProductsModal({ order, onClose }) {
  const { user } = useAuth();
  const { showSuccess, showError, showWarning } = useNotification();
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [returnWindowExpired, setReturnWindowExpired] = useState(false);
  const [actualArrival, setActualArrival] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (order && order.order_id) {
      fetchOrderItems();
    }
  }, [order]);

  const fetchOrderItems = async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      const orderId = order.order_id.replace("ORD-", "");
      const response = await fetch(
        `http://localhost:3000/api/order/return-items/${orderId}?user_id=${user.user_id}`
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setOrderItems(data.data.items);
        setReturnWindowExpired(data.data.returnWindowExpired || false);
        setActualArrival(data.data.actualArrival);
      } else {
        // Handle case where return window has expired
        if (data.data?.returnWindowExpired) {
          setReturnWindowExpired(true);
          setActualArrival(data.data.actualArrival);
          setErrorMessage(data.message || "Return window has expired");
        } else {
          setErrorMessage(data.message || "Failed to load order items");
        }
      }
    } catch (error) {
      console.error("Error fetching order items:", error);
      setErrorMessage("Failed to load order items");
    } finally {
      setLoading(false);
    }
  };

  const handleItemSelection = (orderItemId, isRefundable) => {
    if (!isRefundable) return;

    const newSelectedItems = new Set(selectedItems);
    if (newSelectedItems.has(orderItemId)) {
      newSelectedItems.delete(orderItemId);
    } else {
      newSelectedItems.add(orderItemId);
    }
    setSelectedItems(newSelectedItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedItems.size === 0) {
      showWarning("Selection Required", "Please select at least one item to return");
      return;
    }

    if (!reason.trim()) {
      showWarning("Reason Required", "Please provide a reason for the return");
      return;
    }

    setSubmitting(true);

    try {
      const orderId = order.order_id.replace("ORD-", "");
      const items = Array.from(selectedItems).map((orderItemId) => ({
        order_item_id: orderItemId,
      }));

      const response = await fetch(
        "http://localhost:3000/api/order/return-request",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            order_id: orderId,
            user_id: user.user_id,
            items: items,
            reason: reason,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        showSuccess(
          "Return Request Submitted",
          `Return request submitted successfully for ${selectedItems.size} item(s)`
        );
        onClose();
      } else {
        showError("Request Failed", data.message || "Failed to submit return request");
      }
    } catch (error) {
      console.error("Error submitting return request:", error);
      showError("Request Failed", "Failed to submit return request");
    } finally {
      setSubmitting(false);
    }
  };

  if (!order) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="relative bg-white max-w-2xl w-full rounded-3xl shadow-2xl border-t-[9px] border-red-600 p-0 animate-fadeIn">
        <div className="flex items-center gap-2 absolute -top-8 left-8 bg-gradient-to-br from-red-600 to-red-400 border-4 border-white rounded-full shadow-lg p-4">
          <RotateCcw className="h-8 w-8 text-white" />
        </div>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-red-50 hover:bg-red-100 text-red-700 hover:text-red-800 focus:outline-none"
        >
          <XIcon className="w-6 h-6" />
        </button>
        <div className="p-8 pt-12">
          <h2 className="text-3xl font-extrabold text-red-700 mb-3 tracking-tight">
            Return Products
          </h2>
          <p className="text-sm text-gray-400 mb-6">
            Select products to return from Order {order.order_id}
          </p>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading order items...</p>
            </div>
          ) : returnWindowExpired || errorMessage ? (
            <div className="text-center py-8">
              <div className="mb-4">
                <Ban className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-red-700 mb-2">
                  {returnWindowExpired
                    ? "Return Window Expired"
                    : "Cannot Process Return"}
                </h3>
                <p className="text-gray-600 mb-4">
                  {returnWindowExpired
                    ? "Returns are only allowed within 7 days of delivery."
                    : errorMessage}
                </p>
                {actualArrival && (
                  <p className="text-sm text-gray-500">
                    Delivered on:{" "}
                    {new Date(actualArrival).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}
              </div>
              <Button
                onClick={onClose}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-bold"
              >
                Close
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select items to return:
                </label>
                <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                  {orderItems.map((item) => (
                    <div
                      key={item.order_item_id}
                      className={`p-4 border-b border-gray-100 last:border-b-0 ${
                        !item.is_refundable ? "bg-gray-50" : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedItems.has(item.order_item_id)}
                            onChange={() =>
                              handleItemSelection(
                                item.order_item_id,
                                item.is_refundable
                              )
                            }
                            disabled={
                              !item.is_refundable ||
                              item.return_status !== "none"
                            }
                            className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500"
                          />
                          <div>
                            <div className="font-medium text-gray-900">
                              {item.product_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              Quantity: {item.quantity} × ৳{item.price}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          {!item.is_refundable ? (
                            <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
                              Not Refundable
                            </span>
                          ) : item.return_status !== "none" ? (
                            <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
                              Return {item.return_status}
                            </span>
                          ) : (
                            <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                              Refundable
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for return:
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                  placeholder="Please explain why you want to return these items..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || selectedItems.size === 0}
                  className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-3 rounded-lg font-bold"
                >
                  {submitting
                    ? "Submitting..."
                    : `Return ${selectedItems.size} Item(s)`}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

const CancelOrderModal = React.memo(
  ({ isOpen, order, onClose, onConfirm, reason, setReason, cancelling }) => {
    if (!isOpen || !order) return null;

    const handleReasonChange = (e) => {
      setReason(e.target.value);
    };

    const handleKeyDown = (e) => {
      // Prevent any unwanted form submissions or page reloads
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (reason.trim()) {
          onConfirm();
        }
      }
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="relative bg-white max-w-md w-full rounded-3xl shadow-2xl border-t-[9px] border-red-600 p-0 animate-fadeIn">
          <div className="flex items-center gap-2 absolute -top-8 left-8 bg-gradient-to-br from-red-600 to-red-400 border-4 border-white rounded-full shadow-lg p-4">
            <Ban className="h-8 w-8 text-white" />
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-red-50 hover:bg-red-100 text-red-700 hover:text-red-800 focus:outline-none"
          >
            <XIcon className="w-6 h-6" />
          </button>
          <div className="p-8 pt-12">
            <h2 className="text-3xl font-extrabold text-red-700 mb-3 tracking-tight">
              Cancel Order
            </h2>
            <p className="text-sm text-gray-400 mb-6">
              Are you sure you want to cancel Order {order.order_id}?
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for cancellation:
              </label>
              <textarea
                value={reason}
                onChange={handleReasonChange}
                onKeyDown={handleKeyDown}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                placeholder="Please tell us why you want to cancel this order..."
                required
                autoFocus
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-bold"
                disabled={cancelling}
              >
                Keep Order
              </Button>
              <Button
                type="button"
                onClick={onConfirm}
                disabled={cancelling || !reason.trim()}
                className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-3 rounded-lg font-bold"
              >
                {cancelling ? "Cancelling..." : "Cancel Order"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

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
              {order.order_date
                ? new Date(order.order_date).toLocaleString("en-US")
                : "Date not available"}
            </span>
          </p>
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 font-semibold w-[120px]">
                Order ID:
              </span>
              <span className="text-gray-900 font-bold">
                {order.order_id || "Unknown"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 font-semibold w-[120px]">
                Status:
              </span>
              <span
                className={`font-bold px-3 py-1 rounded-full text-sm bg-purple-50 text-purple-700 flex items-center gap-2`}
              >
                {order.status || "Pending"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 font-semibold w-[120px]">
                Address:
              </span>
              <span className="text-gray-900">
                {order.delivery_address || "Address not available"}
              </span>
            </div>
          </div>
          <div className="mb-2">
            <span className="font-semibold text-gray-600 mb-2 block">
              Order Items:
            </span>
            {Array.isArray(order.items) && order.items.length > 0 ? (
              <div className="divide-y divide-gray-100 bg-gray-50 rounded-xl overflow-hidden border border-gray-200">
                {order.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-4 px-4 py-3"
                  >
                    <div className="flex-shrink-0">
                      <img
                        src={item?.image_url || item?.image || "https://via.placeholder.com/60x60"}
                        alt={item?.product_name || "Product"}
                        className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                        onError={(e) => {
                          e.target.src = "https://via.placeholder.com/60x60";
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-gray-900">
                        {item?.product_name || (
                          <i className="text-gray-400">Unknown Item</i>
                        )}
                      </div>
                      {item?.category && (
                        <div className="text-xs text-gray-500">
                          {item.category}
                        </div>
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
              <div className="text-gray-400 italic text-center py-3">
                No items found.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MyOrders() {
  const { user, isLoggedIn } = useAuth();
  const { notification, showSuccess, showError, showWarning, hideNotification } = useNotification();
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
  const [showDeliveryReview, setShowDeliveryReview] = useState(false);
  const [showProductReview, setShowProductReview] = useState(false);
  const [showReturnProducts, setShowReturnProducts] = useState(false);
  const [reviewOrder, setReviewOrder] = useState(null);
  const [reviewedDeliveries, setReviewedDeliveries] = useState(new Set());
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  // Optimized cancel reason setter to prevent re-renders
  const handleSetCancelReason = useCallback((value) => {
    setCancelReason(value);
  }, []);

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
        // Check review statuses for completed orders
        checkReviewStatuses(data.data);
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

  const handleDeliveryReview = (order) => {
    setReviewOrder(order);
    setShowDeliveryReview(true);
  };

  const handleProductReview = (order) => {
    setReviewOrder(order);
    setShowProductReview(true);
  };

  const handleReturnProducts = (order) => {
    setReviewOrder(order);
    setShowReturnProducts(true);
  };

  const handleCancelOrder = useCallback((order) => {
    setOrderToCancel(order);
    setCancelReason("");
    setShowCancelConfirm(true);
  }, []);

  const closeCancelModal = useCallback(() => {
    setShowCancelConfirm(false);
    setOrderToCancel(null);
    setCancelReason("");
  }, []);

  const confirmCancelOrder = useCallback(async () => {
    if (!cancelReason.trim()) {
      showWarning("Reason Required", "Please provide a reason for cancellation");
      return;
    }

    setCancelling(true);
    try {
      const orderId = orderToCancel.order_id.replace("ORD-", "");
      const response = await fetch(
        `http://localhost:3000/api/order/cancel/${orderId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cancelled_by: user.user_id,
            reason: cancelReason,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        showSuccess("Order Cancelled", "Order cancelled successfully");
        closeCancelModal();
        // Refresh orders
        fetchOrders(activeTab);
        fetchOrderStats();
      } else {
        showError("Cancellation Failed", data.message || "Failed to cancel order");
      }
    } catch (error) {
      console.error("Error cancelling order:", error);
      showError("Cancellation Failed", "Failed to cancel order. Please try again.");
    } finally {
      setCancelling(false);
    }
  }, [
    cancelReason,
    orderToCancel,
    user.user_id,
    activeTab,
    closeCancelModal,
    fetchOrders,
    fetchOrderStats,
  ]);

  // Check if delivery review exists for an order
  const checkDeliveryReviewStatus = async (orderId) => {
    if (!user || !user.user_id) return false;

    try {
      const response = await fetch(
        `http://localhost:3000/api/reviews/delivery-check/${orderId}?user_id=${user.user_id}`
      );
      if (response.ok) {
        const data = await response.json();
        return data.success && data.data.exists;
      }
    } catch (error) {
      console.error("Error checking delivery review status:", error);
    }
    return false;
  };

  // Check review status for all completed orders
  const checkReviewStatuses = async (ordersList) => {
    if (!user || !user.user_id) return;

    const deliveryReviewed = new Set();

    for (const order of ordersList) {
      // Only check for completed/delivered orders
      if (
        order.status === "delivery_completed" ||
        order.status === "delivered" ||
        order.status === "payment_received"
      ) {
        // Check delivery review
        const hasDeliveryReview = await checkDeliveryReviewStatus(
          order.order_id
        );
        if (hasDeliveryReview) {
          deliveryReviewed.add(order.order_id);
        }
      }
    }

    setReviewedDeliveries(deliveryReviewed);
  };

  const closeReviewModals = () => {
    setShowDeliveryReview(false);
    setShowProductReview(false);
    setShowReturnProducts(false);
    setReviewOrder(null);
  };

  const getStatusColor = (status) => {
    if (!status) return "text-gray-600 bg-gray-50";

    switch (status) {
      case "delivered":
      case "delivery_completed":
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
      case "payment_received":
        return "text-green-600 bg-green-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getStatusIcon = (status) => {
    if (!status) return <Package className="w-5 h-5" />;

    switch (status) {
      case "delivered":
      case "delivery_completed":
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
      case "payment_received":
        return <CheckCircle className="w-5 h-5" />;
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

  const formatDeliveryTime = (estimatedArrival, actualArrival, status) => {
    // If order is completed and we have actual arrival time
    if (
      actualArrival &&
      (status === "delivery_completed" ||
        status === "delivered" ||
        status === "payment_received")
    ) {
      return `Delivered on ${formatDate(actualArrival)}`;
    }

    // If order is active and we have estimated arrival time
    if (estimatedArrival && status !== "cancelled") {
      const now = new Date();
      const estimated = new Date(estimatedArrival);

      // Check if the estimated time has passed
      if (estimated < now) {
        return `Expected ${formatDate(estimatedArrival)} (Overdue)`;
      } else {
        return `Expected ${formatDate(estimatedArrival)}`;
      }
    }

    // For cancelled orders
    if (status === "cancelled") {
      return "Order cancelled";
    }

    // For pending/incomplete orders without estimated time
    return "Delivery time pending";
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
              <h3 className="text-lg font-bold text-gray-800 mb-1">
                {order.order_id || "Unknown Order"}
              </h3>
              <div className="flex items-center gap-1 text-sm font-medium mb-1">
                <Package className="w-3 h-3 text-blue-600" />
                <span className="text-gray-600">
                  Ordered:{" "}
                  {order.order_date
                    ? formatDate(order.order_date)
                    : "Date not available"}
                </span>
              </div>
              <div className="flex items-center gap-1 text-sm font-medium">
                <Truck
                  className={`w-3 h-3 ${
                    order.actual_arrival &&
                    (order.status === "delivery_completed" ||
                      order.status === "delivered" ||
                      order.status === "payment_received")
                      ? "text-green-600"
                      : order.status === "cancelled"
                      ? "text-red-600"
                      : order.estimated_arrival &&
                        new Date(order.estimated_arrival) < new Date()
                      ? "text-orange-600"
                      : "text-purple-600"
                  }`}
                />
                <span
                  className={`${
                    order.actual_arrival &&
                    (order.status === "delivery_completed" ||
                      order.status === "delivered" ||
                      order.status === "payment_received")
                      ? "text-green-600"
                      : order.status === "cancelled"
                      ? "text-red-600"
                      : order.estimated_arrival &&
                        new Date(order.estimated_arrival) < new Date()
                      ? "text-orange-600"
                      : "text-gray-600"
                  }`}
                >
                  {formatDeliveryTime(
                    order.estimated_arrival,
                    order.actual_arrival,
                    order.status
                  )}
                </span>
              </div>
            </div>
            <div
              className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 ${getStatusColor(
                order.status
              )}`}
            >
              {getStatusIcon(order.status)}
              {order.status
                ? order.status.replace("_", " ").toUpperCase()
                : "PENDING"}
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

          {/* Show status flow chart only for active orders and non-completed/cancelled orders */}
          {activeTab === "active" &&
            order.status &&
            !["delivery_completed", "cancelled"].includes(order.status) && (
              <div className="mb-4">
                <StatusFlowChart
                  orderId={order.order_id}
                  currentStatus={order.status}
                  paymentMethod={order.payment_method}
                />
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

            {/* Show cancel button only for active orders that can be cancelled */}
            {(activeTab === "active" ||
              (order.status &&
                ![
                  "delivery_completed",
                  "delivered",
                  "cancelled",
                  "payment_received",
                ].includes(order.status))) && (
              <Button
                onClick={() => handleCancelOrder(order)}
                className="px-6 py-3 rounded-lg shadow-lg transform hover:scale-105 transition duration-300 font-bold flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
              >
                <Ban className="w-4 h-4" />
                Cancel Order
              </Button>
            )}

            {/* Show delivery review button only for delivered/completed orders */}
            {(order.status === "delivery_completed" ||
              order.status === "delivered" ||
              order.status === "payment_received") && (
              <Button
                onClick={() => handleDeliveryReview(order)}
                disabled={reviewedDeliveries.has(order.order_id)}
                className={`px-6 py-3 rounded-lg shadow-lg transform hover:scale-105 transition duration-300 font-bold flex items-center gap-2 ${
                  reviewedDeliveries.has(order.order_id)
                    ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                    : "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
                }`}
              >
                <Truck className="w-4 h-4" />
                {reviewedDeliveries.has(order.order_id)
                  ? "Delivery Reviewed"
                  : "Delivery Review"}
              </Button>
            )}

            {/* Show product review button only for delivered/completed orders */}
            {(order.status === "delivery_completed" ||
              order.status === "delivered" ||
              order.status === "payment_received") && (
              <Button
                onClick={() => handleProductReview(order)}
                className="px-6 py-3 rounded-lg shadow-lg transform hover:scale-105 transition duration-300 font-bold flex items-center gap-2 bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white"
              >
                <Star className="w-4 h-4" />
                Product Review
              </Button>
            )}

            {/* Show return products button only for delivered/completed orders */}
            {(order.status === "delivery_completed" ||
              order.status === "delivered" ||
              order.status === "payment_received") && (
              <Button
                onClick={() => handleReturnProducts(order)}
                disabled={order.return_window_expired}
                className={`px-6 py-3 rounded-lg shadow-lg transform hover:scale-105 transition duration-300 font-bold flex items-center gap-2 ${
                  order.return_window_expired
                    ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                    : "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
                }`}
                title={
                  order.return_window_expired
                    ? "Return window has expired (7 days limit)"
                    : "Return products from this order"
                }
              >
                <RotateCcw className="w-4 h-4" />
                {order.return_window_expired
                  ? "Return Expired"
                  : "Return Products"}
              </Button>
            )}
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
                      {
                        key: "completed",
                        label: "Completed",
                        icon: CheckCircle,
                      },
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
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    Active Orders
                  </h3>
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
              <p className="text-gray-600 font-semibold text-lg">
                Loading your orders...
              </p>
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
          {showDeliveryReview && (
            <DeliveryReviewModal
              order={reviewOrder}
              onClose={closeReviewModals}
            />
          )}
          {showProductReview && (
            <ProductReviewModal
              order={reviewOrder}
              onClose={closeReviewModals}
            />
          )}
          {showReturnProducts && (
            <ReturnProductsModal
              order={reviewOrder}
              onClose={closeReviewModals}
            />
          )}
          <CancelOrderModal
            isOpen={showCancelConfirm}
            order={orderToCancel}
            onClose={closeCancelModal}
            onConfirm={confirmCancelOrder}
            reason={cancelReason}
            setReason={handleSetCancelReason}
            cancelling={cancelling}
          />
        </div>

        {/* Notification Component */}
        <Notification
          show={notification.show}
          type={notification.type}
          title={notification.title}
          message={notification.message}
          onClose={hideNotification}
        />
      </div>
    </div>
  );
}
