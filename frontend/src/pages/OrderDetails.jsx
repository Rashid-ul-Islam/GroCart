import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Package,
  Truck,
  MapPin,
  Clock,
  CreditCard,
  User,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Star,
  Calendar,
  DollarSign,
  Tag,
  Box,
  MessageSquare,
} from "lucide-react";

const OrderDetailsPage = () => {
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { orderId } = useParams();
  const navigate = useNavigate();
  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const getCurrentUser = () => {
    const userData = sessionStorage.getItem("user");
    return userData ? JSON.parse(userData) : null;
  };

  // Check if user is logged in
  const isUserLoggedIn = () => {
    return sessionStorage.getItem("token") && sessionStorage.getItem("user");
  };

  useEffect(() => {
    if (!isUserLoggedIn()) {
      navigate("/login");
      return;
    }
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId, navigate]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = sessionStorage.getItem("token");

      // Fetch order details from your API
      const response = await fetch(
        `http://localhost:3000/api/order/${orderId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setOrderData(result.data);
      } else {
        throw new Error(result.message || "Failed to fetch order details");
      }
    } catch (err) {
      console.error("Error fetching order details:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount || 0);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      confirmed: "bg-blue-100 text-blue-800 border-blue-200",
      processing: "bg-purple-100 text-purple-800 border-purple-200",
      shipped: "bg-orange-100 text-orange-800 border-orange-200",
      delivered: "bg-green-100 text-green-800 border-green-200",
      cancelled: "bg-red-100 text-red-800 border-red-200",
      paid: "bg-green-100 text-green-800 border-green-200",
      failed: "bg-red-100 text-red-800 border-red-200",
      refunded: "bg-gray-100 text-gray-800 border-gray-200",
    };
    return colors[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: <Clock className="w-4 h-4" />,
      confirmed: <CheckCircle className="w-4 h-4" />,
      processing: <Package className="w-4 h-4" />,
      shipped: <Truck className="w-4 h-4" />,
      delivered: <CheckCircle className="w-4 h-4" />,
      cancelled: <XCircle className="w-4 h-4" />,
      paid: <CheckCircle className="w-4 h-4" />,
      failed: <XCircle className="w-4 h-4" />,
      refunded: <AlertCircle className="w-4 h-4" />,
    };
    return icons[status] || <AlertCircle className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error && !orderData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Order Not Found
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.history.back()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // If orderData is not loaded yet, show loading state
  if (!orderData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Order #{orderData?.order_id || "N/A"}
                </h1>
                <p className="text-sm text-gray-500">
                  Placed on {formatDate(orderData?.order_date)}
                </p>
              </div>
            </div>
            <div
              className={`px-4 py-2 rounded-full border flex items-center space-x-2 ${getStatusColor(
                orderData?.current_status || "pending"
              )}`}
            >
              {getStatusIcon(orderData?.current_status || "pending")}
              <span className="font-medium capitalize">
                {orderData?.current_status || "pending"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center space-x-2 mb-6">
                <Box className="w-5 h-5 text-gray-600" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Order Items
                </h2>
              </div>
              <div className="space-y-4">
                {orderData?.items?.length > 0 ? (
                  orderData.items.map((item) => (
                    <div
                      key={item.order_item_id}
                      className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg"
                    >
                      <img
                        src={item.image_url || "/placeholder-product.jpg"}
                        alt={item.name || "Product"}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          {item.name || "Unknown Product"}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {item.description || "No description"}
                        </p>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-sm text-gray-500">
                            Origin: {item.origin || "N/A"}
                          </span>
                          <span className="text-sm text-gray-500">
                            Unit: {item.unit_measure || "N/A"}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          {formatCurrency(item.price)}
                        </p>
                        <p className="text-sm text-gray-600">
                          Qty: {item.quantity || 0}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No items found in this order</p>
                  </div>
                )}
              </div>
            </div>

            {/* Order Timeline */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center space-x-2 mb-6">
                <Calendar className="w-5 h-5 text-gray-600" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Order Timeline
                </h2>
              </div>
              <div className="space-y-4">
                {orderData?.status_history?.length > 0 ? (
                  orderData.status_history.map((status, index) => (
                    <div key={index} className="flex items-start space-x-4">
                      <div
                        className={`p-2 rounded-full ${getStatusColor(
                          status.status || "pending"
                        )}`}
                      >
                        {getStatusIcon(status.status || "pending")}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-gray-900 capitalize">
                            {status.status || "unknown"}
                          </h3>
                          <span className="text-sm text-gray-500">
                            {formatDate(status.updated_at)}
                          </span>
                        </div>
                        {status.first_name && (
                          <p className="text-sm text-gray-600">
                            Updated by {status.first_name}{" "}
                            {status.last_name || ""}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No status history available</p>
                  </div>
                )}
              </div>
            </div>

            {/* Delivery Information */}
            {orderData.estimated_arrival && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center space-x-2 mb-6">
                  <Truck className="w-5 h-5 text-gray-600" />
                  <h2 className="text-xl font-semibold text-gray-900">
                    Delivery Information
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">
                      Estimated Arrival
                    </p>
                    <p className="text-gray-900">
                      {formatDate(orderData.estimated_arrival)}
                    </p>
                  </div>
                  {orderData.actual_arrival && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">
                        Actual Arrival
                      </p>
                      <p className="text-gray-900">
                        {formatDate(orderData.actual_arrival)}
                      </p>
                    </div>
                  )}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">
                      Delivery Status
                    </p>
                    <p className="text-gray-900">
                      {orderData.is_aborted ? "Delivery Aborted" : "On Track"}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">
                      Delivery Boy Status
                    </p>
                    <span
                      className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        orderData.delivery_boy_status === "available"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {orderData.delivery_boy_status}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center space-x-2 mb-6">
                <DollarSign className="w-5 h-5 text-gray-600" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Order Summary
                </h2>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Product Total</span>
                  <span className="text-gray-900">
                    {formatCurrency(orderData.product_total)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="text-gray-900">
                    {formatCurrency(orderData.shipping_total)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span className="text-gray-900">
                    {formatCurrency(orderData.tax_total)}
                  </span>
                </div>
                {orderData.discount_total > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discount</span>
                    <span className="text-green-600">
                      -{formatCurrency(orderData.discount_total)}
                    </span>
                  </div>
                )}
                <div className="border-t pt-3">
                  <div className="flex justify-between font-semibold text-lg">
                    <span className="text-gray-900">Total</span>
                    <span className="text-gray-900">
                      {formatCurrency(orderData.total_amount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center space-x-2 mb-6">
                <CreditCard className="w-5 h-5 text-gray-600" />
                <h2 className="text-xl font-semibold text-gray-900">Payment</h2>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Payment Method</span>
                  <span className="text-gray-900">
                    {orderData.payment_method}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Payment Status</span>
                  <span
                    className={`font-medium ${
                      orderData.payment_status === "Completed"
                        ? "text-green-600"
                        : "text-yellow-600"
                    }`}
                  >
                    {orderData.payment_status}
                  </span>
                </div>
                {orderData.transaction_id && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Transaction ID</span>
                    <span className="text-gray-900 font-mono text-xs">
                      {orderData.transaction_id}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Customer Information */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center space-x-2 mb-6">
                <User className="w-5 h-5 text-gray-600" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Customer
                </h2>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-900">
                    {orderData.first_name} {orderData.last_name}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-900">{orderData.email}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-900">
                    {orderData.phone_number}
                  </span>
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center space-x-2 mb-6">
                <MapPin className="w-5 h-5 text-gray-600" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Delivery Address
                </h2>
              </div>
              <p className="text-gray-900 leading-relaxed">
                {orderData.address}
              </p>
            </div>

            {/* Applied Coupons */}
            {orderData.coupons && orderData.coupons.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center space-x-2 mb-6">
                  <Tag className="w-5 h-5 text-gray-600" />
                  <h2 className="text-xl font-semibold text-gray-900">
                    Applied Coupons
                  </h2>
                </div>
                <div className="space-y-3">
                  {orderData?.coupons?.map((coupon, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
                    >
                      <div>
                        <p className="font-medium text-green-800">
                          {coupon.code}
                        </p>
                        <p className="text-sm text-green-600">
                          {coupon.description}
                        </p>
                      </div>
                      <span className="text-green-800 font-medium">
                        -{formatCurrency(coupon.discount_amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsPage;
