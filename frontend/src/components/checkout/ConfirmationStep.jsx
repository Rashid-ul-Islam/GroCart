import React from "react";
import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ConfirmationStep = ({
  calculateTotal,
  paymentMethod,
  selectedAddress,
  orderData,
}) => {
  const navigate = useNavigate();

  const viewOrderDetails = () => {
    if (orderData?.orderId) {
      navigate(`/order-details/${orderData.orderId}`);
    }
  };

  return (
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
              ৳{calculateTotal().toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Payment Method:</span>
            <span className="capitalize">
              {paymentMethod === "wallet"
                ? "GroCart Balance"
                : paymentMethod === "cod"
                ? "Cash on Delivery"
                : paymentMethod === "bkash"
                ? "bKash"
                : paymentMethod}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Delivery Address:</span>
            <span className="text-right">{selectedAddress?.address}</span>
          </div>
        </div>
      </div>

      <motion.button
        onClick={viewOrderDetails}
        className="bg-blue-600 text-white py-3 px-8 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        View Order Details
      </motion.button>
    </motion.div>
  );
};

export default ConfirmationStep;
