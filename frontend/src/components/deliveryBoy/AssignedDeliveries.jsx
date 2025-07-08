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
      return "bg-blue-100 text-blue-800";
    case "left_warehouse":
      return "bg-indigo-100 text-indigo-800";
    case "in_transit":
      return "bg-purple-100 text-purple-800";
    case "delivery_completed":
      return "bg-green-100 text-green-800";
    case "payment_received":
      return "bg-green-100 text-green-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
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
      return "bg-red-100 text-red-800";
    case "medium":
      return "bg-orange-100 text-orange-800";
    case "low":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-gray-100 text-gray-800";
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
        setDeliveries(data.data || []);
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
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Products fetched response:", data);

      if (data.success) {
        // Refresh the deliveries list to show updated status
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
        // Refresh the deliveries list to show updated status
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
        // Refresh the deliveries list
        await fetchDeliveries(true);
        setShowRatingModal(false);
        setSelectedDelivery(null);

        // Show success message
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

    // Debug log to see what statuses we're getting
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
          color: "bg-blue-600 hover:bg-blue-700",
          handler: handleProductsFetched,
        });
        break;

      case "left_warehouse":
      case "in_transit":
        actions.push({
          key: "delivery_completed",
          label: "Delivery Completed",
          icon: CheckCircle,
          color: "bg-green-600 hover:bg-green-700",
          handler: handleDeliveryCompleted,
        });
        break;

      case "delivery_completed":
        // Show message that payment is being processed
        break;

      case "payment_received":
        actions.push({
          key: "rate_customer",
          label: "Rate Customer",
          icon: User,
          color: "bg-purple-600 hover:bg-purple-700",
          handler: handleRateCustomer,
        });
        break;

      default:
        // Log unknown statuses for debugging
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

      // Auto-refresh every 5 minutes
      const interval = setInterval(() => fetchDeliveries(true), 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [user?.user_id]);

  // Loading state
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Today's Assigned Deliveries
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading deliveries...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Error Loading Deliveries
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => fetchDeliveries()} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Today's Assigned Deliveries
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{deliveries.length} deliveries</Badge>
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              disabled={refreshing}
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {deliveries.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">
              No deliveries assigned for today
            </p>
            <p className="text-sm text-gray-400">
              Check back later for new assignments
            </p>
          </div>
        ) : (
          deliveries.map((delivery) => (
            <div
              key={delivery.id}
              className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900">
                      {delivery.id}
                    </span>
                    <Badge className={getPriorityColor(delivery.priority)}>
                      {delivery.priority}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <User className="h-4 w-4" />
                    <span className="font-medium">{delivery.customerName}</span>
                  </div>

                  {/* Customer contact info */}
                  {delivery.customerPhone && (
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                      <Phone className="h-4 w-4" />
                      <span>{delivery.customerPhone}</span>
                    </div>
                  )}

                  {delivery.customerEmail && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Mail className="h-4 w-4" />
                      <span>{delivery.customerEmail}</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge
                    className={getStatusColor(
                      delivery.currentStatus || "assigned"
                    )}
                  >
                    {getStatusDisplay(delivery.currentStatus || "assigned")}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {delivery.status}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-600">
                  <strong>Address:</strong> {delivery.address}
                </p>
                <p className="text-sm text-gray-500">
                  <strong>Items:</strong>{" "}
                  {delivery.items?.join(", ") || "No items listed"}
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>
                    <strong>ETA:</strong> {delivery.estimatedTime}
                  </span>
                </div>
                {delivery.totalAmount && (
                  <p className="text-sm text-gray-600">
                    <strong>Total:</strong> ${delivery.totalAmount.toFixed(2)}
                  </p>
                )}
                {delivery.paymentStatus && (
                  <p className="text-sm text-gray-600">
                    <strong>Payment:</strong> {delivery.paymentStatus}
                  </p>
                )}
              </div>

              {/* Status message for delivery completed */}
              {delivery.currentStatus === "delivery_completed" && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Waiting for payment confirmation...
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                {getAvailableActions(delivery).map((action) => (
                  <Button
                    key={action.key}
                    size="sm"
                    className={`flex-1 ${action.color}`}
                    onClick={() => action.handler(delivery)}
                    disabled={processingDelivery === delivery.id}
                  >
                    {processingDelivery === delivery.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <action.icon className="h-4 w-4 mr-2" />
                    )}
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>
          ))
        )}
      </CardContent>

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
    </Card>
  );
};
