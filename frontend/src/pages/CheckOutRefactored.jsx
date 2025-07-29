import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag,
  MapPin,
  CreditCard,
  CheckCircle,
} from "lucide-react";

// Import components
import OrderReviewStep from "../components/checkout/OrderReviewStep";
import ShippingStep from "../components/checkout/ShippingStep";
import PaymentStep from "../components/checkout/PaymentStep";
import ConfirmationStep from "../components/checkout/ConfirmationStep";
import OrderSummary from "../components/checkout/OrderSummary";
import StockAvailabilityModal from "../components/checkout/StockAvailabilityModal";

// Import custom hook
import { useCheckout } from "../hooks/useCheckout";

const CheckoutPage = () => {
  const {
    // State
    currentStep,
    setCurrentStep,
    orderData,
    addresses,
    selectedAddress,
    setSelectedAddress,
    paymentMethod,
    setPaymentMethod,
    isLoading,
    couponCode,
    setCouponCode,
    appliedCoupon,
    showAddressForm,
    setShowAddressForm,
    isProcessingOrder,
    stockCheckResult,
    showStockModal,
    setShowStockModal,
    isCheckingStock,
    newAddress,
    setNewAddress,
    cardDetails,
    setCardDetails,
    paymentProcessing,
    paymentError,

    // Functions
    updateQuantity,
    removeItem,
    checkStockAvailability,
    applyCoupon,
    removeCoupon,
    addNewAddress,
    refreshAddresses,
    initializePayment,
    processOrder,
    goBackToReview,
    updateCartQuantities,
    calculateTotal,
  } = useCheckout();

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
              {currentStep === 1 && (
                <OrderReviewStep
                  key="review"
                  orderData={orderData}
                  updateQuantity={updateQuantity}
                  removeItem={removeItem}
                  checkStockAvailability={checkStockAvailability}
                  setCurrentStep={setCurrentStep}
                  isCheckingStock={isCheckingStock}
                />
              )}
              {currentStep === 2 && (
                <ShippingStep
                  key="shipping"
                  addresses={addresses}
                  selectedAddress={selectedAddress}
                  setSelectedAddress={setSelectedAddress}
                  showAddressForm={showAddressForm}
                  setShowAddressForm={setShowAddressForm}
                  newAddress={newAddress}
                  setNewAddress={setNewAddress}
                  addNewAddress={addNewAddress}
                  refreshAddresses={refreshAddresses}
                  goBackToReview={goBackToReview}
                  setCurrentStep={setCurrentStep}
                />
              )}
              {currentStep === 3 && (
                <PaymentStep
                  key="payment"
                  paymentMethod={paymentMethod}
                  setPaymentMethod={setPaymentMethod}
                  cardDetails={cardDetails}
                  setCardDetails={setCardDetails}
                  setCurrentStep={setCurrentStep}
                  initializePayment={initializePayment}
                  processOrder={processOrder}
                  isProcessingOrder={isProcessingOrder}
                  paymentProcessing={paymentProcessing}
                  paymentError={paymentError}
                />
              )}
              {currentStep === 4 && (
                <ConfirmationStep
                  key="confirmation"
                  calculateTotal={calculateTotal}
                  paymentMethod={paymentMethod}
                  selectedAddress={selectedAddress}
                  orderData={orderData}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <OrderSummary
              orderData={orderData}
              currentStep={currentStep}
              couponCode={couponCode}
              setCouponCode={setCouponCode}
              applyCoupon={applyCoupon}
              appliedCoupon={appliedCoupon}
              removeCoupon={removeCoupon}
              calculateTotal={calculateTotal}
            />
          </div>
        </div>
      </div>

      {/* Stock Availability Modal */}
      <StockAvailabilityModal
        showStockModal={showStockModal}
        setShowStockModal={setShowStockModal}
        stockCheckResult={stockCheckResult}
        orderData={orderData}
        updateCartQuantities={updateCartQuantities}
        checkStockAvailability={checkStockAvailability}
        setCurrentStep={setCurrentStep}
      />
    </div>
  );
};

export default CheckoutPage;
