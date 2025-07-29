import React from "react";
import { motion } from "framer-motion";
import { Tag, X, Lock } from "lucide-react";

const OrderSummary = ({
  orderData,
  currentStep,
  couponCode,
  setCouponCode,
  applyCoupon,
  appliedCoupon,
  removeCoupon,
  calculateTotal,
}) => {
  return (
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
                  src={item.image_url || item.image || "https://via.placeholder.com/300x200"}
                  alt={item.name}
                  className="w-12 h-12 object-cover rounded-lg"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/300x200";
                  }}
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
          <span className="text-green-600">Subtotal</span>
          <span className="font-medium text-green-600">
            ${orderData?.subtotal?.toFixed(2) || "0.00"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-green-600">Shipping</span>
          <span className="font-medium text-green-600">
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
          <span className="text-green-600">Tax</span>
          <span className="font-medium text-green-600">
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
};

export default OrderSummary;
