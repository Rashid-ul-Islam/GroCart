import React from "react";
import { motion } from "framer-motion";
import { CreditCard, Gift, CheckCircle, AlertCircle } from "lucide-react";

const PaymentStep = ({
  paymentMethod,
  setPaymentMethod,
  cardDetails,
  setCardDetails,
  setCurrentStep,
  initializePayment,
  processOrder,
  isProcessingOrder,
  paymentProcessing,
  paymentError,
}) => {
  const handlePaymentClick = async () => {
    if (paymentMethod === 'cod') {
      // For COD, directly process the order
      await processOrder();
    } else {
      // For card/bKash, initialize payment gateway
      await initializePayment();
    }
  };
  return (
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

      {/* Payment Error Display */}
      {paymentError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6"
        >
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-700 font-medium">Payment Error</span>
          </div>
          <p className="text-red-600 text-sm mt-1">{paymentError}</p>
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
          onClick={handlePaymentClick}
          disabled={isProcessingOrder || paymentProcessing}
          className="flex-1 bg-green-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {(isProcessingOrder || paymentProcessing) ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
            />
          ) : (
            <>
              <span>{paymentMethod === 'cod' ? 'Place Order' : 'Pay Now'}</span>
              <CheckCircle className="w-5 h-5" />
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
};

export default PaymentStep;
