import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card.jsx";
import { Button } from "../ui/button.jsx";
import { Badge } from "../ui/badge.jsx";
import {
  Clock,
  CheckCircle,
  User,
  Calendar,
  AlertTriangle,
  Phone,
  Mail,
  RefreshCw,
  Package,
  Truck,
  Warehouse,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { WarehouseInventory } from "./WarehouseInventory.jsx";
import CustomerRatingModal from "./CustomerRatingModal.jsx";

const getStatusColor = (status) => {
  switch (status) {
    case "assigned":
      return "bg-gradient-to-r from-blue-500 to-blue-600 text-white";
    case "left_warehouse":
      return "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white";
    case "in_transit":
      return "bg-gradient-to-r from-purple-500 to-purple-600 text-white";
    case "delivery_completed":
      return "bg-gradient-to-r from-green-500 to-green-600 text-white";
    case "payment_received":
      return "bg-gradient-to-r from-green-600 to-green-700 text-white";
    case "cancelled":
      return "bg-gradient-to-r from-red-500 to-red-600 text-white";
    default:
      return "bg-gradient-to-r from-gray-500 to-gray-600 text-white";
  }
};

const getStatusDisplay = (status) => {
  switch (status) {
    case "assigned":
      return "Assigned";
    case "left_warehouse":
      return "Left Warehouse";
    case "in_transit":
      return "In Transit";
    case "delivery_completed":
      return "Delivered";
    case "payment_received":
      return "Payment Received";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
};

const getPriorityColor = (priority) => {
  switch (priority) {
    case "high":
      return "bg-gradient-to-r from-red-600 to-red-700 text-white";
    case "medium":
      return "bg-gradient-to-r from-orange-500 to-orange-600 text-white";
    case "low":
      return "bg-gradient-to-r from-blue-500 to-blue-600 text-white";
    default:
      return "bg-gradient-to-r from-gray-500 to-gray-600 text-white";
  }
};

export const AssignedDeliveries = () => {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingDelivery, setProcessingDelivery] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);

  // Fetch assigned deliveries from API
  const fetchDeliveries = async (isRefresh = false) => {
    if (!user?.user_id) return;

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      console.log("Fetching deliveries for delivery boy:", user.user_id);

      const response = await fetch(
        `http://localhost:3000/api/delivery/getAssignedDeliveries/${user.user_id}`,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Deliveries API response:", data);

      if (data.success) {
        // Filter out cancelled deliveries from the dashboard
        const activeDeliveries = (data.data || []).filter((delivery) => {
          const status =
            delivery.currentStatus || delivery.status || "assigned";
          return status !== "cancelled";
        });
        setDeliveries(activeDeliveries);
      } else {
        throw new Error(data.message || "Failed to fetch deliveries");
      }
    } catch (error) {
      console.error("Error fetching deliveries:", error);
      setError(error.message || "Network error. Please check your connection.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Action 1: Mark products as fetched (transition to left_warehouse)
  const handleProductsFetched = async (delivery) => {
    if (!delivery.delivery_id) {
      alert("Invalid delivery ID");
      return;
    }

    setProcessingDelivery(delivery.id);

    try {
      console.log("Marking products as fetched:", delivery.delivery_id);

      const response = await fetch(
        `http://localhost:3000/api/delivery/markProductsFetched/${delivery.delivery_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            delivery_boy_id: user.user_id,
          }),
        }
      );

      if (!response.ok) {
        console.error("Failed to mark products as fetched:", response);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Products fetched response:", data);

      if (data.success) {
        await fetchDeliveries(true);
        alert("Products marked as fetched successfully!");
      } else {
        throw new Error(data.message || "Failed to mark products as fetched");
      }
    } catch (error) {
      console.error("Error marking products as fetched:", error);
      alert(error.message || "Network error. Please try again.");
    } finally {
      setProcessingDelivery(null);
    }
  };

  // Action 2: Mark delivery as completed
  const handleDeliveryCompleted = async (delivery) => {
    if (!delivery.delivery_id) {
      alert("Invalid delivery ID");
      return;
    }

    setProcessingDelivery(delivery.id);

    try {
      console.log("Marking delivery as completed:", delivery.delivery_id);

      const response = await fetch(
        `http://localhost:3000/api/delivery/markDeliveryCompletedNew/${delivery.delivery_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            delivery_boy_id: user.user_id,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Delivery completed response:", data);

      if (data.success) {
        await fetchDeliveries(true);
        alert("Delivery marked as completed successfully!");
      } else {
        throw new Error(data.message || "Failed to mark delivery as completed");
      }
    } catch (error) {
      console.error("Error marking delivery as completed:", error);
      alert(error.message || "Network error. Please try again.");
    } finally {
      setProcessingDelivery(null);
    }
  };

  // Action 3: Rate customer (after payment received)
  const handleRateCustomer = async (delivery) => {
    if (!delivery.delivery_id) {
      alert("Invalid delivery ID");
      return;
    }

    setSelectedDelivery(delivery);
    setShowRatingModal(true);
  };

  // Handle rating submission from modal
  const handleRatingSubmit = async (ratingData) => {
    if (!selectedDelivery?.delivery_id) {
      throw new Error("Invalid delivery ID");
    }

    setProcessingDelivery(selectedDelivery.id);

    try {
      console.log(
        "Rating customer for delivery:",
        selectedDelivery.delivery_id
      );

      const response = await fetch(
        `http://localhost:3000/api/delivery/rateCustomer/${selectedDelivery.delivery_id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            delivery_boy_id: user.user_id,
            ...ratingData,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Rate customer response:", data);

      if (data.success) {
        await fetchDeliveries(true);
        setShowRatingModal(false);
        setSelectedDelivery(null);

        const customerName =
          selectedDelivery?.first_name && selectedDelivery?.last_name
            ? `${selectedDelivery.first_name} ${selectedDelivery.last_name}`
            : "Customer";
        alert(`✅ Rating submitted successfully for ${customerName}!`);
      } else {
        throw new Error(data.message || "Failed to submit customer rating");
      }
    } catch (error) {
      console.error("Error submitting customer rating:", error);
      alert(`Error: ${error.message}`);
      throw error;
    } finally {
      setProcessingDelivery(null);
    }
  };

  // Determine which actions are available based on current status
  const getAvailableActions = (delivery) => {
    const status = delivery.currentStatus || "assigned";
    const actions = [];

    console.log("Delivery status for action buttons:", {
      delivery_id: delivery.delivery_id,
      order_id: delivery.order_id,
      currentStatus: delivery.currentStatus,
      status: delivery.status,
      effectiveStatus: status,
    });

    switch (status) {
      case "pending":
      case "confirmed":
      case "assigned":
        actions.push({
          key: "products_fetched",
          label: "Products Fetched",
          icon: Package,
          color:
            "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800",
          handler: handleProductsFetched,
        });
        break;

      case "left_warehouse":
      case "in_transit":
        actions.push({
          key: "delivery_completed",
          label: "Delivery Completed",
          icon: CheckCircle,
          color:
            "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800",
          handler: handleDeliveryCompleted,
        });
        break;

      case "delivery_completed":
        actions.push({
          key: "rate_customer",
          label: "Rate Customer",
          icon: User,
          color:
            "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800",
          handler: handleRateCustomer,
        });
        break;

      case "payment_received":
        // No actions needed after payment is received and customer is rated
        break;

      default:
        console.warn("Unknown delivery status, no actions available:", {
          status,
          delivery_id: delivery.delivery_id,
          order_id: delivery.order_id,
        });
        break;
    }

    return actions;
  };

  // Manual refresh
  const handleRefresh = () => {
    fetchDeliveries(true);
  };

  // Fetch deliveries on component mount and when user changes
  useEffect(() => {
    if (user?.user_id) {
      fetchDeliveries();

      const interval = setInterval(() => fetchDeliveries(true), 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [user?.user_id]);

  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-100 rounded-full p-3">
            <Calendar className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800">
            📦 Today's Assigned Deliveries
          </h3>
        </div>
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <RefreshCw className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
            <span className="text-gray-600 font-semibold">
              Loading deliveries...
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-red-100 rounded-full p-3">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800">
            ❌ Error Loading Deliveries
          </h3>
        </div>
        <div className="text-center py-8">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4 font-semibold">{error}</p>
          <Button
            onClick={() => fetchDeliveries()}
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-3 rounded-lg shadow-lg transform hover:scale-105 transition duration-300 font-bold"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-full p-3">
            <Truck className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-800">
              📦 Today's Assigned Deliveries
            </h3>
            <p className="text-gray-600">Manage your delivery tasks</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2 rounded-full font-bold text-lg">
            {deliveries.length} deliveries
          </Badge>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg shadow-lg transform hover:scale-105 transition duration-300 font-bold flex items-center gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {deliveries.length === 0 ? (
          <div className="text-center py-12 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
            <p className="text-gray-700 mb-2 text-xl font-semibold">
              🎉 No deliveries assigned for today
            </p>
            <p className="text-gray-500 font-medium">
              Check back later for new assignments
            </p>
          </div>
        ) : (
          deliveries.map((delivery) => (
            <div
              key={delivery.id}
              className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-xl hover:border-blue-300 hover:scale-102 transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xl font-bold text-gray-800">
                      #{delivery.id}
                    </span>
                    <Badge
                      className={`${getPriorityColor(
                        delivery.priority
                      )} px-3 py-1 rounded-full font-semibold`}
                    >
                      🔥 {delivery.priority}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700 mb-2">
                    <User className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold text-lg">
                      {delivery.customerName}
                    </span>
                  </div>

                  {/* Customer contact info */}
                  {delivery.customerPhone && (
                    <div className="flex items-center gap-2 text-gray-600 mb-1">
                      <Phone className="h-4 w-4 text-green-600" />
                      <span className="font-medium">
                        📞 {delivery.customerPhone}
                      </span>
                    </div>
                  )}

                  {delivery.customerEmail && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="h-4 w-4 text-purple-600" />
                      <span className="font-medium">
                        📧 {delivery.customerEmail}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge
                    className={`${getStatusColor(
                      delivery.currentStatus || "assigned"
                    )} px-4 py-2 rounded-full font-bold text-lg`}
                  >
                    {getStatusDisplay(delivery.currentStatus || "assigned")}
                  </Badge>
                  <Badge className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 px-3 py-1 rounded-full text-xs font-semibold">
                    {delivery.status}
                  </Badge>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-3">
                <p className="text-gray-700 font-medium">
                  <strong className="text-gray-800">📍 Address:</strong>{" "}
                  {delivery.address}
                </p>
                <p className="text-gray-600 font-medium">
                  <strong className="text-gray-800">📦 Items:</strong>{" "}
                  {delivery.items?.join(", ") || "No items listed"}
                </p>
                <div className="flex items-center gap-2 text-gray-700 font-medium">
                  <Clock className="h-5 w-5 text-orange-600" />
                  <span>
                    <strong>⏰ ETA:</strong> {delivery.estimatedTime}
                  </span>
                </div>
                {delivery.totalAmount && (
                  <p className="text-gray-700 font-medium">
                    <strong className="text-gray-800">💰 Total:</strong> $
                    {delivery.totalAmount.toFixed(2)}
                  </p>
                )}
                {delivery.paymentStatus && (
                  <p className="text-gray-700 font-medium">
                    <strong className="text-gray-800">💳 Payment:</strong>{" "}
                    {delivery.paymentStatus}
                  </p>
                )}
              </div>

              {/* Status message for delivery completed */}
              {delivery.currentStatus === "delivery_completed" && (
                <div className="bg-gradient-to-r from-green-50 to-green-100 border-l-4 border-green-500 rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-bold">
                      ✅ Delivery completed! Please rate the customer.
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                {getAvailableActions(delivery).map((action) => (
                  <Button
                    key={action.key}
                    className={`flex-1 ${action.color} text-white py-3 rounded-lg shadow-lg transform hover:scale-105 transition duration-300 font-bold`}
                    onClick={() => action.handler(delivery)}
                    disabled={processingDelivery === delivery.id}
                  >
                    {processingDelivery === delivery.id ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    ) : (
                      <action.icon className="h-5 w-5 mr-2" />
                    )}
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Customer Rating Modal */}
      <CustomerRatingModal
        isOpen={showRatingModal}
        onClose={() => {
          setShowRatingModal(false);
          setSelectedDelivery(null);
        }}
        delivery={selectedDelivery}
        onSubmit={handleRatingSubmit}
      />
    </div>
  );
};
