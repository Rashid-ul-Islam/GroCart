import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Wallet,
  Gift,
  CheckCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

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
  const { user, isLoggedIn } = useAuth();
  const [walletBalance, setWalletBalance] = useState(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  // Function to fetch wallet balance
  const fetchWalletBalance = async () => {
    if (!user || !isLoggedIn) {
      console.log("No user found or not logged in");
      return;
    }

    setIsLoadingBalance(true);
    try {
      console.log("Fetching wallet balance for user:", user.user_id);
      const response = await fetch(
        `http://localhost:3000/api/wallet/balance/${user.user_id}`,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        }
      );
      const data = await response.json();
      console.log("User id:", user.user_id);
      console.log("Wallet API response:", data);

      if (data.success && data.wallet) {
        const balance = parseFloat(data.wallet.balance);
        setWalletBalance(balance);
        console.log("Wallet balance set to:", balance);
      } else {
        console.error("Wallet API error:", data);
        setWalletBalance(0);
      }
    } catch (error) {
      console.error("Error fetching wallet balance:", error);
      setWalletBalance(0);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  // Fetch wallet balance when component mounts or user changes
  useEffect(() => {
    if (user && isLoggedIn) {
      fetchWalletBalance();
    }
  }, [user, isLoggedIn]);

  const handlePaymentClick = async () => {
    if (paymentMethod === "cod") {
      // For COD, directly process the order
      await processOrder();
    } else if (paymentMethod === "wallet") {
      // For wallet payment, process the order with wallet payment
      await processOrder();
    } else {
      // For bKash, initialize payment gateway
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
        {/* Wallet Balance Option */}
        <motion.div
          onClick={() => setPaymentMethod("wallet")}
          className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
            paymentMethod === "wallet"
              ? "border-blue-600 bg-blue-50"
              : "border-gray-200 hover:border-gray-300"
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Wallet className="w-6 h-6 text-blue-600" />
              <div>
                <span className="font-semibold text-gray-900">
                  GroCart Balance
                </span>
                <div className="text-sm text-gray-600">
                  {isLoadingBalance
                    ? "Loading balance..."
                    : `Available: ৳${walletBalance.toFixed(2)}`}
                </div>
              </div>
            </div>
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                fetchWalletBalance();
              }}
              disabled={isLoadingBalance}
              className="p-2 text-gray-400 hover:text-blue-600 transition-colors disabled:opacity-50"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="Refresh balance"
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoadingBalance ? "animate-spin" : ""}`}
              />
            </motion.button>
          </div>
        </motion.div>

        {/* bKash Option */}
        <motion.div
          onClick={() => setPaymentMethod("bkash")}
          className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
            paymentMethod === "bkash"
              ? "border-blue-600 bg-blue-50"
              : "border-gray-200 hover:border-gray-300"
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-pink-600 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">bK</span>
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
          {isProcessingOrder || paymentProcessing ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
            />
          ) : (
            <>
              <span>
                {paymentMethod === "cod"
                  ? "Place Order"
                  : paymentMethod === "wallet"
                  ? "Pay with Balance"
                  : "Pay Now"}
              </span>
              <CheckCircle className="w-5 h-5" />
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
};

export default PaymentStep;
