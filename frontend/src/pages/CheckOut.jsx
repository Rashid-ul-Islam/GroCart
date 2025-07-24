import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard,
  MapPin,
  ShoppingBag,
  Lock,
  CheckCircle,
  ArrowRight,
  Edit,
  Plus,
  Minus,
  Gift,
  Tag,
  Trash2,
  X,
  AlertTriangle,
  User,
  Phone,
  Mail,
  Calendar,
  Shield,
} from "lucide-react";

const CheckoutPage = () => {
  // State Management
  const [currentStep, setCurrentStep] = useState(1);
  const [orderData, setOrderData] = useState({
    items: [],
    subtotal: 0,
    tax: 0,
    shipping: 0,
    discount: 0,
    estimatedArrival: null, // Add estimated arrival state
  });
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [isLoading, setIsLoading] = useState(true);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [stockCheckResult, setStockCheckResult] = useState(null);
  const [showStockModal, setShowStockModal] = useState(false);
  const [isCheckingStock, setIsCheckingStock] = useState(false);
  const [isStockReserved, setIsStockReserved] = useState(false);
  const [isReleasingStock, setIsReleasingStock] = useState(false);
  const navigate = useNavigate();
  const [newAddress, setNewAddress] = useState({
    address: "",
    region_id: 1,
    isPrimary: false,
  });
  const [cardDetails, setCardDetails] = useState({
    number: "",
    expiry: "",
    cvv: "",
    name: "",
  });

  // Utility Functions
  const getCurrentUser = () => {
    const userData = sessionStorage.getItem("user");
    return userData ? JSON.parse(userData) : null;
  };

  const isUserLoggedIn = () => {
    return sessionStorage.getItem("token") && sessionStorage.getItem("user");
  };
  // Fetch shipping cost and estimated delivery
  const fetchShippingAndDelivery = async () => {
    try {
      const user = getCurrentUser();
      if (!user || !user.user_id)
        return { shipping: 50, estimatedArrival: null };

      const response = await fetch(
        `http://localhost:3000/api/order/calculate-shipping/${user.user_id}`,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          return {
            shipping: data.data.shipping_cost,
            estimatedArrival: data.data.estimated_delivery_date,
          };
        }
      }
    } catch (error) {
      console.error("Error fetching shipping and delivery:", error);
    }

    // Fallback to default shipping cost if API fails
    return { shipping: 50, estimatedArrival: null };
  };

  // Data Fetching
  useEffect(() => {
    if (!isUserLoggedIn()) {
      window.location.href = "/login";
      return;
    }
    fetchCheckoutData();
  }, []);

  // Cleanup effect to release reserved stock when leaving checkout (component unmount only)
  useEffect(() => {
    return () => {
      // Release stock when component unmounts only if stock is reserved
      if (isStockReserved && orderData?.items?.length > 0) {
        console.log("Component unmounting - releasing reserved stock");
        releaseStock();
      }
    };
  }, []); // Empty dependency array - only runs on mount/unmount

  // Release stock if user goes back from shipping step
  const goBackToReview = () => {
    if (isStockReserved) {
      console.log("Releasing stock - user going back to review");
      releaseStock();
      setIsStockReserved(false);
    }
    setCurrentStep(1);
  };

  const viewOrderDetails = () => {
    if (orderData?.orderId) {
      navigate(`/order-details/${orderData.orderId}`);
    }
  };
  const fetchCheckoutData = async () => {
    setIsLoading(true);
    try {
      const user = getCurrentUser();
      const token = sessionStorage.getItem("token");

      // Fetch cart items
      const cartResponse = await fetch(
        `http://localhost:3000/api/cart/getCart/${user.user_id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const cartData = await cartResponse.json();

      // Fetch user addresses
      const addressResponse = await fetch(
        `http://localhost:3000/api/address/getAddress/${user.user_id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const addressData = await addressResponse.json();

      // Fetch shipping and delivery information only if there are items
      const hasItems = cartData.data && cartData.data.length > 0;
      const shippingData = hasItems
        ? await fetchShippingAndDelivery()
        : { shipping: 0, estimatedArrival: null };

      const subtotal =
        cartData.data?.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        ) || 0;
      const tax = subtotal * 0;

      setOrderData({
        items: cartData.data || [],
        subtotal,
        tax,
        shipping: hasItems ? shippingData.shipping : 0,
        discount: 0,
        estimatedArrival: hasItems ? shippingData.estimatedArrival : null,
      });

      setAddresses(addressData.data || []);
      setSelectedAddress(
        addressData.data?.find((addr) => addr.isPrimary) ||
          addressData.data?.[0]
      );
    } catch (error) {
      console.error("Error fetching checkout data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Coupon Functions
  const applyCoupon = async () => {
    if (!couponCode.trim()) return;

    try {
      const response = await fetch(
        `http://localhost:3000/api/coupon/validate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            code: couponCode,
            orderTotal: orderData.subtotal,
          }),
        }
      );

      const couponData = await response.json();
      if (couponData.success) {
        setAppliedCoupon(couponData.data);
        setOrderData((prev) => ({
          ...prev,
          discount: couponData.data.discount_amount,
        }));
      }
    } catch (error) {
      console.error("Error applying coupon:", error);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setOrderData((prev) => ({
      ...prev,
      discount: 0,
    }));
  };

  // Address Functions
  const addNewAddress = async () => {
    if (!newAddress.address.trim()) return;

    try {
      const user = getCurrentUser();
      const response = await fetch(
        `http://localhost:3000/api/address/addAddress`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            ...newAddress,
            user_id: user.user_id,
          }),
        }
      );

      if (response.ok) {
        const addressData = await response.json();
        setAddresses((prev) => [...prev, addressData.data]);
        setSelectedAddress(addressData.data);
        setShowAddressForm(false);
        setNewAddress({ address: "", region_id: 1, isPrimary: false });
      }
    } catch (error) {
      console.error("Error adding address:", error);
    }
  };

  // Order Functions
  const calculateTotal = () => {
    if (!orderData || !orderData.items || orderData.items.length === 0)
      return 0;
    const { subtotal, tax, shipping, discount } = orderData;
    return Math.max(0, subtotal + tax + shipping - discount);
  };

  const updateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;

    try {
      const response = await fetch(
        `http://localhost:3000/api/cart/updateCart/item/${itemId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
          body: JSON.stringify({ quantity: newQuantity }),
        }
      );

      if (response.ok) {
        const updatedItems = orderData.items.map((item) =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        );

        // Recalculate subtotal after updating quantity
        const newSubtotal = updatedItems.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );

        setOrderData((prev) => ({
          ...prev,
          items: updatedItems,
          subtotal: newSubtotal,
          // Reset shipping and estimated arrival if no items
          shipping: updatedItems.length === 0 ? 0 : prev.shipping,
          estimatedArrival:
            updatedItems.length === 0 ? null : prev.estimatedArrival,
        }));
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
    }
  };

  const removeItem = async (itemId) => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/cart/deleteCart/item/${itemId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        // Remove item from state
        const updatedItems = orderData.items.filter(
          (item) => item.id !== itemId
        );

        // Recalculate subtotal after removing item
        const newSubtotal = updatedItems.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );

        setOrderData((prev) => ({
          ...prev,
          items: updatedItems,
          subtotal: newSubtotal,
          // Reset shipping and estimated arrival if no items
          shipping: updatedItems.length === 0 ? 0 : prev.shipping,
          estimatedArrival:
            updatedItems.length === 0 ? null : prev.estimatedArrival,
        }));

        // If no items left, refresh the entire checkout data to ensure consistency
        if (updatedItems.length === 0) {
          await fetchCheckoutData();
        }
      }
    } catch (error) {
      console.error("Error removing item:", error);
    }
  };

  const processOrder = async () => {
    setIsProcessingOrder(true);
    try {
      const user = getCurrentUser();
      const orderPayload = {
        user_id: user.user_id,
        items: orderData.items,
        address_id: selectedAddress.address_id,
        payment_method: paymentMethod,
        total_amount: calculateTotal(),
        product_total: orderData.subtotal,
        tax_total: orderData.tax,
        shipping_total: orderData.shipping,
        discount_total: orderData.discount,
        coupon_id: appliedCoupon?.coupon_id || null,
      };

      const response = await fetch(`http://localhost:3000/api/order/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
        body: JSON.stringify(orderPayload),
      });

      if (response.ok) {
        const orderResult = await response.json();

        // Order confirmed - stock should be permanently deducted, not released
        // The backend order creation will handle final stock deduction
        setIsStockReserved(false); // Clear reservation state

        setOrderConfirmed(true);
        setCurrentStep(4);
        // Store the order ID for navigation
        setOrderData((prev) => ({
          ...prev,
          orderId: orderResult.data.order_id,
        }));
      }
    } catch (error) {
      console.error("Error processing order:", error);
    } finally {
      setIsProcessingOrder(false);
    }
  };

  // Stock checking functions
  const checkStockAvailability = async () => {
    setIsCheckingStock(true);
    try {
      const items = orderData.items.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
      }));

      const response = await fetch(
        "http://localhost:3000/api/stock/check-availability",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
          body: JSON.stringify({ items }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setStockCheckResult(data.data);

        if (!data.data.all_available) {
          setShowStockModal(true);
          return false;
        } else {
          // All items available - now reserve the stock
          console.log("Stock check passed, now reserving stock...");
          const reserveSuccess = await reserveStock(items);
          if (reserveSuccess) {
            console.log("Stock successfully reserved!");
            setIsStockReserved(true);
            return true;
          } else {
            console.log("Stock reservation failed!");
            return false;
          }
        }
      } else {
        console.error("Stock check failed:", data.message);
        return false;
      }
    } catch (error) {
      console.error("Error checking stock:", error);
      return false;
    } finally {
      setIsCheckingStock(false);
    }
  };

  const reserveStock = async (items) => {
    try {
      const response = await fetch("http://localhost:3000/api/stock/reserve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
        body: JSON.stringify({ items }),
      });

      const data = await response.json();
      if (!data.success) {
        console.error("Stock reservation failed:", data.message);
        // Show stock modal if reservation failed
        if (data.failed_items) {
          setStockCheckResult({
            all_available: false,
            unavailable_items: data.failed_items,
          });
          setShowStockModal(true);
        }
        return false;
      }
      return true;
    } catch (error) {
      console.error("Error reserving stock:", error);
      return false;
    }
  };

  const releaseStock = async () => {
    if (isReleasingStock) {
      console.log("releaseStock already in progress, skipping");
      return;
    }

    setIsReleasingStock(true);
    try {
      console.log("releaseStock called - releasing reserved stock");
      const items = orderData.items.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
      }));

      await fetch("http://localhost:3000/api/stock/release", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
        body: JSON.stringify({ items }),
      });

      // Reset the reservation state
      setIsStockReserved(false);
      console.log("Stock released successfully");
    } catch (error) {
      console.error("Error releasing stock:", error);
    } finally {
      setIsReleasingStock(false);
    }
  };

  const updateCartQuantities = async (adjustedItems) => {
    try {
      for (const item of adjustedItems) {
        await updateQuantity(item.id, item.quantity);
      }
      // Refresh checkout data after updates
      await fetchCheckoutData();
    } catch (error) {
      console.error("Error updating cart quantities:", error);
    }
  };

  // Step Configuration
  const steps = [
    { id: 1, title: "Review Order", icon: ShoppingBag },
    { id: 2, title: "Shipping", icon: MapPin },
    { id: 3, title: "Payment", icon: CreditCard },
    { id: 4, title: "Confirmation", icon: CheckCircle },
  ];

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  // Order Review Step Component
  const OrderReviewStep = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-white rounded-2xl shadow-lg p-6"
    >
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Review Your Order
      </h2>

      <div className="space-y-4">
        {orderData?.items?.length > 0 ? (
          orderData.items.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center space-x-4 p-4 border border-gray-200 rounded-xl hover:shadow-md transition-shadow"
            >
              {/* ...existing item content... */}
              <img
                src={item.image_url || "/placeholder-product.jpg"}
                alt={item.name}
                className="w-16 h-16 object-cover rounded-lg"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{item.name}</h3>
                <p className="text-sm text-gray-600">{item.description}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-lg font-bold text-blue-600">
                    ${item.price}
                  </span>
                  <div className="flex items-center space-x-2">
                    <motion.button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-1 rounded-full hover:bg-gray-100"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Minus className="w-4 h-4" />
                    </motion.button>
                    <span className="w-8 text-center font-medium">
                      {item.quantity}
                    </span>
                    <motion.button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-1 rounded-full hover:bg-gray-100"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Plus className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      onClick={() => removeItem(item.id)}
                      className="p-1 rounded-full hover:bg-red-100 text-red-600 ml-2"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              Your cart is empty
            </h3>
            <p className="text-gray-500 mb-6">
              Add some items to your cart to continue with checkout
            </p>
            <motion.button
              onClick={() => navigate("/")}
              className="bg-blue-600 text-white py-2 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Continue Shopping
            </motion.button>
          </motion.div>
        )}
      </div>

      <motion.button
        onClick={async () => {
          const stockAvailable = await checkStockAvailability();
          if (stockAvailable) {
            setCurrentStep(2);
          }
        }}
        disabled={!orderData?.items?.length || isCheckingStock}
        className={`w-full mt-6 py-3 px-6 rounded-xl font-semibold transition-colors flex items-center justify-center space-x-2 ${
          orderData?.items?.length > 0 && !isCheckingStock
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "bg-gray-300 text-gray-500 cursor-not-allowed"
        }`}
        whileHover={
          orderData?.items?.length > 0 && !isCheckingStock
            ? { scale: 1.02 }
            : {}
        }
        whileTap={
          orderData?.items?.length > 0 && !isCheckingStock
            ? { scale: 0.98 }
            : {}
        }
      >
        {isCheckingStock ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
            />
            <span>Checking Stock...</span>
          </>
        ) : (
          <>
            <span>Continue to Shipping</span>
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </motion.button>
    </motion.div>
  );

  // Shipping Step Component
  const ShippingStep = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-white rounded-2xl shadow-lg p-6"
    >
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Shipping Address
      </h2>

      <div className="space-y-4 mb-6">
        {addresses.map((address) => (
          <motion.div
            key={address.address_id}
            onClick={() => setSelectedAddress(address)}
            className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
              selectedAddress?.address_id === address.address_id
                ? "border-blue-600 bg-blue-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-gray-900">{address.address}</p>
                {address.isPrimary && (
                  <span className="inline-block mt-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    Primary
                  </span>
                )}
              </div>
              <Edit className="w-4 h-4 text-gray-400" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add New Address Form */}
      {showAddressForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-6 p-4 border border-gray-200 rounded-xl"
        >
          <h3 className="font-semibold text-gray-900 mb-4">Add New Address</h3>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Enter full address"
              value={newAddress.address}
              onChange={(e) =>
                setNewAddress((prev) => ({ ...prev, address: e.target.value }))
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isPrimary"
                checked={newAddress.isPrimary}
                onChange={(e) =>
                  setNewAddress((prev) => ({
                    ...prev,
                    isPrimary: e.target.checked,
                  }))
                }
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="isPrimary" className="text-sm text-gray-700">
                Set as primary address
              </label>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={addNewAddress}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Address
              </button>
              <button
                onClick={() => setShowAddressForm(false)}
                className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </motion.div>
      )}

      <motion.button
        onClick={() => setShowAddressForm(true)}
        className="w-full mb-6 border-2 border-dashed border-gray-300 text-gray-600 py-3 px-6 rounded-xl hover:border-blue-600 hover:text-blue-600 transition-colors flex items-center justify-center space-x-2"
        whileHover={{ scale: 1.02 }}
      >
        <Plus className="w-5 h-5" />
        <span>Add New Address</span>
      </motion.button>

      <div className="flex space-x-4">
        <motion.button
          onClick={goBackToReview}
          className="flex-1 border border-gray-300 text-gray-700 py-3 px-6 rounded-xl hover:bg-gray-50 transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Back
        </motion.button>
        <motion.button
          onClick={() => setCurrentStep(3)}
          disabled={!selectedAddress}
          className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span>Continue to Payment</span>
          <ArrowRight className="w-5 h-5" />
        </motion.button>
      </div>
    </motion.div>
  );

  // Payment Step Component
  const PaymentStep = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-white rounded-2xl shadow-lg p-6"
    >
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment Method</h2>

      <div className="space-y-4 mb-6">
        {/* Credit Card Option */}
        <motion.div
          onClick={() => setPaymentMethod("card")}
          className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
            paymentMethod === "card"
              ? "border-blue-600 bg-blue-50"
              : "border-gray-200 hover:border-gray-300"
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center space-x-3">
            <CreditCard className="w-6 h-6 text-blue-600" />
            <span className="font-semibold text-gray-900">
              Credit/Debit Card
            </span>
          </div>
        </motion.div>

        {/* PayPal Option */}
        <motion.div
          onClick={() => setPaymentMethod("paypal")}
          className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
            paymentMethod === "paypal"
              ? "border-blue-600 bg-blue-50"
              : "border-gray-200 hover:border-gray-300"
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">P</span>
            </div>
            <span className="font-semibold text-gray-900">bKash</span>
          </div>
        </motion.div>

        {/* Cash on Delivery */}
        <motion.div
          onClick={() => setPaymentMethod("cod")}
          className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
            paymentMethod === "cod"
              ? "border-blue-600 bg-blue-50"
              : "border-gray-200 hover:border-gray-300"
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center space-x-3">
            <Gift className="w-6 h-6 text-green-600" />
            <span className="font-semibold text-gray-900">
              Cash on Delivery
            </span>
          </div>
        </motion.div>
      </div>

      {/* Card Details Form */}
      {paymentMethod === "card" && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mb-6 p-4 border border-gray-200 rounded-xl"
        >
          <h3 className="font-semibold text-gray-900 mb-4">Card Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="Card Number"
                value={cardDetails.number}
                onChange={(e) =>
                  setCardDetails((prev) => ({
                    ...prev,
                    number: e.target.value,
                  }))
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <input
              type="text"
              placeholder="MM/YY"
              value={cardDetails.expiry}
              onChange={(e) =>
                setCardDetails((prev) => ({ ...prev, expiry: e.target.value }))
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="text"
              placeholder="CVV"
              value={cardDetails.cvv}
              onChange={(e) =>
                setCardDetails((prev) => ({ ...prev, cvv: e.target.value }))
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="Cardholder Name"
                value={cardDetails.name}
                onChange={(e) =>
                  setCardDetails((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </motion.div>
      )}

      <div className="flex space-x-4">
        <motion.button
          onClick={() => setCurrentStep(2)}
          className="flex-1 border border-gray-300 text-gray-700 py-3 px-6 rounded-xl hover:bg-gray-50 transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Back
        </motion.button>
        <motion.button
          onClick={processOrder}
          disabled={isProcessingOrder}
          className="flex-1 bg-green-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isProcessingOrder ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
            />
          ) : (
            <>
              <span>Place Order</span>
              <CheckCircle className="w-5 h-5" />
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );

  // Confirmation Step Component
  const ConfirmationStep = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-2xl shadow-lg p-8 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
      >
        <CheckCircle className="w-10 h-10 text-green-600" />
      </motion.div>

      <h2 className="text-3xl font-bold text-gray-900 mb-4">
        Order Confirmed!
      </h2>
      <p className="text-gray-600 mb-6">
        Thank you for your purchase. Your order has been successfully placed and
        will be processed shortly.
      </p>

      <div className="bg-gray-50 rounded-xl p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Order Total:</span>
            <span className="font-semibold">
              ${calculateTotal().toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Payment Method:</span>
            <span className="capitalize">{paymentMethod}</span>
          </div>
          <div className="flex justify-between">
            <span>Delivery Address:</span>
            <span className="text-right">{selectedAddress?.address}</span>
          </div>
        </div>
      </div>

      <motion.button
        onClick={() => viewOrderDetails()}
        className="bg-blue-600 text-white py-3 px-8 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        View Order Details
      </motion.button>
    </motion.div>
  );

  // Order Summary Sidebar Component
  const OrderSummary = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg p-6 sticky top-8"
    >
      <h3 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h3>

      {/* Order Items */}
      <div className="space-y-3 mb-6">
        {orderData?.items?.length > 0 ? (
          orderData.items.map((item) => (
            <div key={item.id} className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <img
                  src={item.image_url || "/placeholder-product.jpg"}
                  alt={item.name}
                  className="w-12 h-12 object-cover rounded-lg"
                />
                <div>
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                </div>
              </div>
              <span className="font-semibold text-gray-900">
                ${(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-500 text-sm">No items in cart</p>
          </div>
        )}
      </div>

      {/* Coupon Code */}
      {currentStep < 4 && orderData?.items?.length > 0 && (
        <div className="mb-6">
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Coupon code"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <motion.button
              onClick={applyCoupon}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Tag className="w-4 h-4" />
            </motion.button>
          </div>
          {appliedCoupon && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between"
            >
              <p className="text-sm text-green-800">
                Coupon "{appliedCoupon.code}" applied!
              </p>
              <button
                onClick={removeCoupon}
                className="text-green-600 hover:text-green-800"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </div>
      )}

      {/* Price Breakdown */}
      <div className="space-y-2 mb-6 pb-6 border-b border-gray-200">
        <div className="flex justify-between">
          <span className=" text-green-600">Subtotal</span>
          <span className="font-medium  text-green-600">
            ${orderData?.subtotal?.toFixed(2) || "0.00"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className=" text-green-600">Shipping</span>
          <span className="font-medium  text-green-600">
            {orderData?.items?.length > 0
              ? `$${orderData?.shipping?.toFixed(2) || "0.00"}`
              : "Free"}
          </span>
        </div>
        {orderData?.estimatedArrival && orderData?.items?.length > 0 && (
          <div className="flex justify-between text-sm text-green-600 font-medium">
            <span>Estimated Arrival</span>
            <span>
              {new Date(orderData.estimatedArrival).toLocaleDateString(
                "en-US",
                {
                  weekday: "short",
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                }
              )}
            </span>
          </div>
        )}
        {orderData?.items?.length === 0 && (
          <div className="flex justify-between text-sm text-gray-500">
            <span>Estimated Arrival</span>
            <span>Not available</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className=" text-green-600">Tax</span>
          <span className="font-medium  text-green-600">
            ${orderData?.tax?.toFixed(2) || "0.00"}
          </span>
        </div>
        {orderData?.discount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Discount</span>
            <span className="font-medium">
              -${orderData.discount.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center text-xl font-bold text-gray-900 mb-6">
        <span>Total</span>
        <span>${calculateTotal().toFixed(2)}</span>
      </div>

      {/* Security Badge - only show when there are items */}
      {orderData?.items?.length > 0 && (
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
          <Lock className="w-4 h-4" />
          <span>Secure 256-bit SSL encryption</span>
        </div>
      )}
    </motion.div>
  );

  // Stock Modal Component
  const StockAvailabilityModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">
            Stock Availability Update
          </h3>
          <button
            onClick={() => {
              setShowStockModal(false);
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          {stockCheckResult?.unavailable_items?.map((item, index) => (
            <div
              key={index}
              className="p-4 border-2 border-red-200 rounded-xl bg-red-50"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{item.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Requested:{" "}
                    <span className="font-medium">{item.requested}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Available:{" "}
                    <span className="font-medium text-green-600">
                      {item.available}
                    </span>
                  </p>
                  {item.available <= 0 ? (
                    <p className="text-sm text-red-600 mt-2 font-medium">
                      {item.reason}
                    </p>
                  ) : (
                    <p className="text-sm text-orange-600 mt-2">
                      You can get up to {item.available} units
                    </p>
                  )}
                </div>
                <AlertTriangle className="w-6 h-6 text-red-500 mt-1" />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-3">
          <motion.button
            onClick={async () => {
              // Adjust quantities to available amounts
              const adjustedItems = orderData.items
                .map((item) => {
                  const unavailableItem =
                    stockCheckResult.unavailable_items.find(
                      (ui) => ui.product_id === item.product_id
                    );
                  if (unavailableItem) {
                    return {
                      ...item,
                      quantity: Math.max(0, unavailableItem.available),
                    };
                  }
                  return item;
                })
                .filter((item) => item.quantity > 0);

              await updateCartQuantities(adjustedItems);
              setShowStockModal(false);
            }}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Adjust to Available Quantities
          </motion.button>

          <motion.button
            onClick={async () => {
              // Check stock again
              setShowStockModal(false);
              const stockAvailable = await checkStockAvailability();
              if (stockAvailable) {
                setCurrentStep(2);
              }
            }}
            className="w-full border border-blue-600 text-blue-600 py-3 px-6 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Check Again
          </motion.button>

          <motion.button
            onClick={() => {
              setShowStockModal(false);
            }}
            className="w-full border border-gray-300 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Continue Shopping
          </motion.button>
        </div>
      </motion.div>
    </div>
  );

  // Main Render
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Progress Steps */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-8">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <motion.div
                  className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${
                    currentStep >= step.id
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "bg-white border-gray-300 text-gray-400"
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <step.icon className="w-5 h-5" />
                </motion.div>
                <span
                  className={`ml-3 text-sm font-medium ${
                    currentStep >= step.id ? "text-blue-600" : "text-gray-400"
                  }`}
                >
                  {step.title}
                </span>
                {index < steps.length - 1 && (
                  <div
                    className={`w-16 h-0.5 mx-4 ${
                      currentStep > step.id ? "bg-blue-600" : "bg-gray-300"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {currentStep === 1 && <OrderReviewStep key="review" />}
              {currentStep === 2 && <ShippingStep key="shipping" />}
              {currentStep === 3 && <PaymentStep key="payment" />}
              {currentStep === 4 && <ConfirmationStep key="confirmation" />}
            </AnimatePresence>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <OrderSummary />
          </div>
        </div>
      </div>

      {/* Stock Availability Modal */}
      {showStockModal && <StockAvailabilityModal />}
    </div>
  );
};

export default CheckoutPage;
