import React from "react";
import { motion } from "framer-motion";
import { X, AlertTriangle } from "lucide-react";

const StockAvailabilityModal = ({
  showStockModal,
  setShowStockModal,
  stockCheckResult,
  orderData,
  updateCartQuantities,
  checkStockAvailability,
  setCurrentStep,
}) => {
  if (!showStockModal) return null;

  const handleAdjustQuantities = async () => {
    const adjustedItems = orderData.items
      .map((item) => {
        const unavailableItem = stockCheckResult.unavailable_items.find(
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
  };

  const handleCheckAgain = async () => {
    setShowStockModal(false);
    const stockAvailable = await checkStockAvailability();
    if (stockAvailable) {
      setCurrentStep(2);
    }
  };

  return (
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
            onClick={() => setShowStockModal(false)}
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
            onClick={handleAdjustQuantities}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Adjust to Available Quantities
          </motion.button>

          <motion.button
            onClick={handleCheckAgain}
            className="w-full border border-blue-600 text-blue-600 py-3 px-6 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Check Again
          </motion.button>

          <motion.button
            onClick={() => setShowStockModal(false)}
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
};

export default StockAvailabilityModal;
