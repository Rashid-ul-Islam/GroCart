import { useState, useEffect, useCallback } from 'react';
import { checkoutService } from '../services/checkoutService';
import { authUtils, calculationUtils, shippingUtils } from '../services/checkoutUtils';

export const useCheckout = () => {
  // State Management
  const [currentStep, setCurrentStep] = useState(1);
  const [orderData, setOrderData] = useState({
    items: [],
    subtotal: 0,
    tax: 0,
    shipping: 0,
    discount: 0,
    estimatedArrival: null,
  });
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("wallet");
  const [isLoading, setIsLoading] = useState(true);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [isLoadingCoupons, setIsLoadingCoupons] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [stockCheckResult, setStockCheckResult] = useState(null);
  const [showStockModal, setShowStockModal] = useState(false);
  const [isCheckingStock, setIsCheckingStock] = useState(false);
  const [isStockReserved, setIsStockReserved] = useState(false);
  const [isReleasingStock, setIsReleasingStock] = useState(false);
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
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [transactionId, setTransactionId] = useState(null);
  const [paymentError, setPaymentError] = useState(null);

  // Fetch checkout data
  const fetchCheckoutData = useCallback(async () => {
    setIsLoading(true);
    try {
      const user = authUtils.getCurrentUser();

      const [cartData, addressData] = await Promise.all([
        checkoutService.getCart(user.user_id),
        checkoutService.getAddresses(user.user_id),
      ]);

      const hasItems = cartData.data && cartData.data.length > 0;
      const shippingData = hasItems
        ? await shippingUtils.fetchShippingAndDelivery()
        : { shipping: 0, estimatedArrival: null };

      const subtotal = calculationUtils.calculateSubtotal(cartData.data);
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
        addressData.data?.find((addr) => addr.isPrimary) || addressData.data?.[0]
      );

      // Fetch available coupons
      await fetchAvailableCoupons(user.user_id);

    } catch (error) {
      console.error("Error fetching checkout data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch available coupons for user
  const fetchAvailableCoupons = useCallback(async (userId) => {
    try {
      setIsLoadingCoupons(true);
      const response = await checkoutService.getAvailableCoupons(userId);
      if (response.coupons) {
        setAvailableCoupons(response.coupons);
      }
    } catch (error) {
      console.error("Error fetching available coupons:", error);
      setAvailableCoupons([]);
    } finally {
      setIsLoadingCoupons(false);
    }
  }, []);

  // Update quantity
  const updateQuantity = useCallback(async (itemId, newQuantity) => {
    if (newQuantity < 1) return;

    try {
      const response = await checkoutService.updateCartItem(itemId, newQuantity);

      if (response.ok !== false) {
        const updatedItems = orderData.items.map((item) =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        );

        const newSubtotal = calculationUtils.calculateSubtotal(updatedItems);

        setOrderData((prev) => ({
          ...prev,
          items: updatedItems,
          subtotal: newSubtotal,
          shipping: updatedItems.length === 0 ? 0 : prev.shipping,
          estimatedArrival: updatedItems.length === 0 ? null : prev.estimatedArrival,
        }));
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
    }
  }, [orderData.items]);

  // Remove item
  const removeItem = useCallback(async (itemId) => {
    try {
      const response = await checkoutService.removeCartItem(itemId);

      if (response.ok !== false) {
        const updatedItems = orderData.items.filter((item) => item.id !== itemId);
        const newSubtotal = calculationUtils.calculateSubtotal(updatedItems);

        setOrderData((prev) => ({
          ...prev,
          items: updatedItems,
          subtotal: newSubtotal,
          shipping: updatedItems.length === 0 ? 0 : prev.shipping,
          estimatedArrival: updatedItems.length === 0 ? null : prev.estimatedArrival,
        }));

        if (updatedItems.length === 0) {
          await fetchCheckoutData();
        }
      }
    } catch (error) {
      console.error("Error removing item:", error);
    }
  }, [orderData.items, fetchCheckoutData]);

  // Stock management
  const checkStockAvailability = useCallback(async () => {
    setIsCheckingStock(true);
    try {
      const items = orderData.items.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
      }));

      const data = await checkoutService.checkStockAvailability(items);

      if (data.success) {
        setStockCheckResult(data.data);

        if (!data.data.all_available) {
          setShowStockModal(true);
          return false;
        } else {
          const reserveData = await checkoutService.reserveStock(items);
          if (reserveData.success) {
            setIsStockReserved(true);
            return true;
          } else {
            if (reserveData.failed_items) {
              setStockCheckResult({
                all_available: false,
                unavailable_items: reserveData.failed_items,
              });
              setShowStockModal(true);
            }
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
  }, [orderData.items]);

  const releaseStock = useCallback(async () => {
    if (isReleasingStock) return;

    setIsReleasingStock(true);
    try {
      const items = orderData.items.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
      }));

      await checkoutService.releaseStock(items);
      setIsStockReserved(false);
    } catch (error) {
      console.error("Error releasing stock:", error);
    } finally {
      setIsReleasingStock(false);
    }
  }, [orderData.items, isReleasingStock]);

  // Coupon management
  const applyCoupon = useCallback(async (selectedCouponCode = null) => {
    const codeToValidate = selectedCouponCode || couponCode.trim();
    console.log('Applying coupon:', codeToValidate);
    if (!codeToValidate) return;

    try {
      const user = authUtils.getCurrentUser();
      console.log('User ID:', user.user_id);
      console.log('Order subtotal:', orderData.subtotal);

      const couponData = await checkoutService.validateCoupon(
        codeToValidate,
        user.user_id,
        orderData.subtotal // Only apply discount to subtotal, not shipping
      );

      console.log('Coupon validation response:', couponData);

      if (couponData.valid) {
        setAppliedCoupon(couponData.coupon);
        setCouponCode(codeToValidate);
        // Apply discount only to subtotal, not to shipping
        setOrderData((prev) => ({
          ...prev,
          discount: couponData.coupon.discount_amount,
        }));
        console.log('Coupon applied successfully:', couponData.coupon);
      } else {
        console.log('Coupon validation failed:', couponData.message);
        alert(couponData.message || 'Invalid coupon');
      }
    } catch (error) {
      console.error("Error applying coupon:", error);
      alert('Error applying coupon');
    }
  }, [couponCode, orderData.subtotal]);

  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
    setCouponCode("");
    setOrderData((prev) => ({
      ...prev,
      discount: 0,
    }));
  }, []);

  // Address management
  const addNewAddress = useCallback(async () => {
    if (!newAddress.address.trim()) return;

    try {
      const user = authUtils.getCurrentUser();
      const response = await checkoutService.addAddress({
        ...newAddress,
        user_id: user.user_id,
      });

      if (response.ok !== false) {
        setAddresses((prev) => [...prev, response.data]);
        setSelectedAddress(response.data);
        setShowAddressForm(false);
        setNewAddress({ address: "", region_id: 1, isPrimary: false });
      }
    } catch (error) {
      console.error("Error adding address:", error);
    }
  }, [newAddress]);

  // Refresh addresses
  const refreshAddresses = useCallback(async (newAddresses) => {
    if (newAddresses) {
      // If new addresses are provided, update state directly
      setAddresses(newAddresses);
    } else {
      // Otherwise, fetch from server
      try {
        const user = authUtils.getCurrentUser();
        if (!user) return;

        const addressData = await checkoutService.getAddresses(user.user_id);
        setAddresses(addressData.data || []);
      } catch (error) {
        console.error("Error refreshing addresses:", error);
      }
    }
  }, []);

  // Payment processing
  const initializePayment = useCallback(async () => {
    if (paymentMethod === 'cod' || paymentMethod === 'wallet') {
      // For COD and wallet, we'll handle this in processOrder
      return { success: true, cod: paymentMethod === 'cod', wallet: paymentMethod === 'wallet' };
    }

    setPaymentProcessing(true);
    setPaymentError(null);

    try {
      const totalAmount = calculationUtils.calculateTotal(orderData);

      // Create transaction with third-party API
      const response = await fetch('https://test-project-production-bf2e.up.railway.app/api/create-trx', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'aa5eb0b4-d8fb-4f21-b4ef-bc8a3b4e07bd',
        },
        body: JSON.stringify({
          username: 'grocart',
          amount: parseFloat(totalAmount),
        }),
      });

      const transactionResult = await response.json();

      if (transactionResult.valid && transactionResult.transactionid) {
        setTransactionId(transactionResult.transactionid);

        // Encode order data for the redirect URL
        const user = authUtils.getCurrentUser();
        const orderPayload = {
          user_id: user.user_id,
          items: orderData.items,
          address_id: selectedAddress.address_id,
          payment_method: paymentMethod,
          total_amount: totalAmount,
          product_total: orderData.subtotal,
          tax_total: orderData.tax,
          shipping_total: orderData.shipping,
          discount_total: orderData.discount,
          coupon_id: appliedCoupon?.coupon_id || null,
          transaction_id: transactionResult.transactionid,
          address_info: selectedAddress
        };

        const encodedOrderData = encodeURIComponent(JSON.stringify(orderPayload));
        const redirectURL = encodeURIComponent(
          `${window.location.origin}/payment-confirmation?transactionId=${transactionResult.transactionid}&orderData=${encodedOrderData}`
        );

        const gatewayURL = `https://tpg-six.vercel.app/gateway?transactionid=${transactionResult.transactionid}&redirectURL=${redirectURL}`;

        // Redirect to payment gateway
        window.location.href = gatewayURL;
      } else {
        setPaymentError(transactionResult.message || 'Failed to initialize payment');
      }
    } catch (error) {
      console.error('Payment initialization error:', error);
      setPaymentError('Failed to connect to payment service');
    } finally {
      setPaymentProcessing(false);
    }
  }, [orderData, selectedAddress, paymentMethod, appliedCoupon]);

  // Original order processing (for COD, wallet, or after payment confirmation)
  // Original order processing (for all payment methods including wallet)
  const processOrder = useCallback(async (orderPayload = null) => {
    setIsProcessingOrder(true);
    setPaymentError(null);

    try {
      const user = authUtils.getCurrentUser();
      const totalAmount = calculationUtils.calculateTotal(orderData);

      // Create order payload - wallet payment will be handled by the backend
      const payload = orderPayload || {
        user_id: user.user_id,
        items: orderData.items,
        address_id: selectedAddress.address_id,
        payment_method: paymentMethod,
        total_amount: totalAmount,
        product_total: orderData.subtotal,
        tax_total: orderData.tax,
        shipping_total: orderData.shipping,
        discount_total: orderData.discount,
        coupon_id: appliedCoupon?.coupon_id || null,
        transaction_id: transactionId || null,
      };

      const orderResult = await checkoutService.createOrder(payload);

      if (orderResult.success !== false) {
        setIsStockReserved(false);
        setOrderConfirmed(true);
        setCurrentStep(4);
        setOrderData((prev) => ({
          ...prev,
          orderId: orderResult.data.order_id,
        }));
      } else {
        // Handle specific error messages from backend
        if (orderResult.message === 'Insufficient balance') {
          setPaymentError('Not enough balance in your wallet. Please top up your wallet to continue.');
        } else {
          setPaymentError(orderResult.message || 'Failed to create order');
        }
      }
    } catch (error) {
      console.error("Error processing order:", error);
      // Check if the error response contains insufficient balance message
      if (error.response && error.response.data && error.response.data.message === 'Insufficient balance') {
        setPaymentError('Not enough balance in your wallet. Please top up your wallet to continue.');
      } else {
        setPaymentError('Failed to process order. Please try again.');
      }
    } finally {
      setIsProcessingOrder(false);
    }
  }, [orderData, selectedAddress, paymentMethod, appliedCoupon, transactionId]);

  const goBackToReview = useCallback(() => {
    if (isStockReserved) {
      releaseStock();
      setIsStockReserved(false);
    }
    setCurrentStep(1);
  }, [isStockReserved, releaseStock]);

  const updateCartQuantities = useCallback(async (adjustedItems) => {
    try {
      for (const item of adjustedItems) {
        await updateQuantity(item.id, item.quantity);
      }
      await fetchCheckoutData();
    } catch (error) {
      console.error("Error updating cart quantities:", error);
    }
  }, [updateQuantity, fetchCheckoutData]);

  // Effect for initial data fetch
  useEffect(() => {
    if (!authUtils.isUserLoggedIn()) {
      window.location.href = "/login";
      return;
    }
    fetchCheckoutData();
  }, [fetchCheckoutData]);

  // Cleanup effect for stock release
  useEffect(() => {
    return () => {
      if (isStockReserved && orderData?.items?.length > 0) {
        releaseStock();
      }
    };
  }, [isStockReserved, orderData?.items?.length, releaseStock]);

  return {
    // State
    currentStep,
    setCurrentStep,
    orderData,
    setOrderData,
    addresses,
    selectedAddress,
    setSelectedAddress,
    paymentMethod,
    setPaymentMethod,
    isLoading,
    couponCode,
    setCouponCode,
    appliedCoupon,
    availableCoupons,
    isLoadingCoupons,
    showAddressForm,
    setShowAddressForm,
    isProcessingOrder,
    orderConfirmed,
    stockCheckResult,
    showStockModal,
    setShowStockModal,
    isCheckingStock,
    isStockReserved,
    newAddress,
    setNewAddress,
    cardDetails,
    setCardDetails,
    paymentProcessing,
    setPaymentProcessing,
    transactionId,
    setTransactionId,
    paymentError,
    setPaymentError,

    // Functions
    fetchCheckoutData,
    fetchAvailableCoupons,
    updateQuantity,
    removeItem,
    checkStockAvailability,
    releaseStock,
    applyCoupon,
    removeCoupon,
    addNewAddress,
    refreshAddresses,
    initializePayment,
    processOrder,
    goBackToReview,
    updateCartQuantities,
    calculateTotal: () => calculationUtils.calculateTotal(orderData),
  };
};
