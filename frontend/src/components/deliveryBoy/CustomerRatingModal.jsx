import React, { useState, useEffect } from "react";
import { X, Star, MessageSquare, UserCheck, UserX, User } from "lucide-react";
import useNotification from "../../hooks/useNotification";
import Notification from "../ui/Notification";

const CustomerRatingModal = ({ isOpen, onClose, delivery, onSubmit }) => {
  const { notification, showError, hideNotification } = useNotification();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [wasAvailable, setWasAvailable] = useState(true);
  const [behavior, setBehavior] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setRating(0);
      setHoverRating(0);
      setComment("");
      setWasAvailable(true);
      setBehavior("");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, isSubmitting]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rating === 0) {
      showError("Rating Required", "Please select a rating before submitting.");
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        rating,
        comment: comment.trim(),
        was_customer_available: wasAvailable,
        behavior: behavior.trim() || "neutral",
      });
    } catch (error) {
      console.error("Error submitting rating:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-gradient-to-br from-pink-300 via-purple-300 to-indigo-400 rounded-3xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-300 p-1">
        {/* Inner White Content Box */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-purple-800">
                ⭐ Rate Customer Experience
              </h2>
              <p className="text-gray-600 font-medium mt-1">
                Order #{delivery?.order_id || delivery?.id} | Delivery #{delivery?.delivery_id || delivery?.id}
              </p>
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="p-2 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 rounded-xl transition-all duration-200 disabled:opacity-50 shadow-md transform hover:scale-105"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Customer Info */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                    <User className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-800 text-lg">
                    👤 {delivery?.customerName || 
                         (delivery?.first_name && delivery?.last_name 
                           ? `${delivery.first_name} ${delivery.last_name}` 
                           : delivery?.customer_name || "Customer")}
                  </p>
                  {(delivery?.customerPhone || delivery?.phone_number) && (
                    <p className="text-gray-600 font-medium">
                      📞 {delivery?.customerPhone || delivery?.phone_number}
                    </p>
                  )}
                  {(delivery?.customerEmail || delivery?.email) && (
                    <p className="text-gray-600 font-medium">
                      📧 {delivery?.customerEmail || delivery?.email}
                    </p>
                  )}
                  {delivery?.address && (
                    <p className="text-gray-500 text-sm mt-1 line-clamp-2">
                      📍 {delivery.address}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-blue-200">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">💰 Order Total:</span>
                  <span className="font-bold text-gray-800 text-lg">
                    ৳{(delivery?.totalAmount || delivery?.total_amount || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Rating */}
            <div className="space-y-4">
              <label className="block text-lg font-bold text-gray-800">
                How would you rate this customer? *
              </label>
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
                <div className="flex items-center justify-center space-x-2 py-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-2 transition-all duration-200 hover:scale-125 active:scale-95 transform"
                    >
                      <Star
                        className={`w-12 h-12 transition-all duration-200 ${
                          star <= (hoverRating || rating)
                            ? "text-yellow-400 fill-current drop-shadow-lg"
                            : "text-gray-300 hover:text-gray-400"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <div className="text-center mt-3">
                  <div className="text-lg font-bold text-gray-700">
                    {rating === 0 && "Click to rate"}
                    {rating === 1 && "⭐ Very Poor"}
                    {rating === 2 && "⭐⭐ Poor"}
                    {rating === 3 && "⭐⭐⭐ Average"}
                    {rating === 4 && "⭐⭐⭐⭐ Good"}
                    {rating === 5 && "⭐⭐⭐⭐⭐ Excellent"}
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Availability */}
            <div className="space-y-4">
              <label className="block text-lg font-bold text-gray-800">
                Was the customer available for delivery?
              </label>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setWasAvailable(true)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-xl border-2 transition-all duration-200 font-bold transform hover:scale-105 ${
                    wasAvailable
                      ? "border-green-500 bg-gradient-to-r from-green-50 to-green-100 text-green-700 shadow-lg"
                      : "border-gray-300 bg-white hover:border-gray-400 text-gray-700"
                  }`}
                >
                  <UserCheck className="w-5 h-5" />
                  <span>✅ Yes</span>
                </button>
                <button
                  type="button"
                  onClick={() => setWasAvailable(false)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-xl border-2 transition-all duration-200 font-bold transform hover:scale-105 ${
                    !wasAvailable
                      ? "border-red-500 bg-gradient-to-r from-red-50 to-red-100 text-red-700 shadow-lg"
                      : "border-gray-300 bg-white hover:border-gray-400 text-gray-700"
                  }`}
                >
                  <UserX className="w-5 h-5" />
                  <span>❌ No</span>
                </button>
              </div>
            </div>

            {/* Customer Behavior */}
            <div className="space-y-4">
              <label className="block text-lg font-bold text-gray-800">
                Customer Behavior
              </label>
              <select
                value={behavior}
                onChange={(e) => setBehavior(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-600 bg-white text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-semibold"
              >
                <option value="">Select behavior...</option>
                <option value="very polite">😊 Very Polite</option>
                <option value="polite">🙂 Polite</option>
                <option value="neutral">😐 Neutral</option>
                <option value="impatient">😤 Impatient</option>
                <option value="rude">😠 Rude</option>
              </select>
            </div>

            {/* Comment */}
            <div className="space-y-4">
              <label className="block text-lg font-bold text-gray-800">
                Additional Comments (Optional)
              </label>
              <div className="relative">
                <MessageSquare className="absolute top-4 left-4 w-5 h-5 text-gray-400" />
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  maxLength={250}
                  placeholder="Share your experience with this customer..."
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-600 bg-white text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none font-medium"
                />
              </div>
              <div className="text-sm text-gray-500 text-right font-medium">
                {comment.length}/250 characters
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-4 pt-6">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-xl font-bold transition-all duration-200 disabled:opacity-50 shadow-lg transform hover:scale-105"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || rating === 0}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg transform hover:scale-105"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Submitting...</span>
                  </div>
                ) : (
                  "✅ Submit Rating"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Notification Component */}
      <Notification
        show={notification.show}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onClose={hideNotification}
      />
    </div>
  );
};

export default CustomerRatingModal;
