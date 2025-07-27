import React from "react";
import { motion } from "framer-motion";
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const OrderReviewStep = ({
  orderData,
  updateQuantity,
  removeItem,
  checkStockAvailability,
  setCurrentStep,
  isCheckingStock,
}) => {
  const navigate = useNavigate();

  const handleContinue = async () => {
    const stockAvailable = await checkStockAvailability();
    if (stockAvailable) {
      setCurrentStep(2);
    }
  };

  return (
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
        onClick={handleContinue}
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
};

export default OrderReviewStep;
