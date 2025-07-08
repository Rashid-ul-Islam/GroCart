import React, { useState, useEffect } from "react";
import { X, Star, MessageSquare, UserCheck, UserX, User } from "lucide-react";

const CustomerRatingModal = ({ isOpen, onClose, delivery, onSubmit }) => {
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
      alert("Please select a rating");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Rate Customer Experience
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Order #{delivery?.order_id}
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Customer Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">
                  {delivery?.first_name && delivery?.last_name
                    ? `${delivery.first_name} ${delivery.last_name}`
                    : "Customer"}
                </p>
                {delivery?.phone_number && (
                  <p className="text-sm text-gray-500">
                    {delivery.phone_number}
                  </p>
                )}
                {delivery?.address && (
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                    {delivery.address}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Order Total:</span>
                <span className="font-medium text-gray-900">
                  ₹{delivery?.total_amount || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Rating */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              How would you rate this customer? *
            </label>
            <div className="flex items-center justify-center space-x-1 py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-2 transition-all duration-200 hover:scale-110 active:scale-95"
                >
                  <Star
                    className={`w-10 h-10 transition-all duration-200 ${
                      star <= (hoverRating || rating)
                        ? "text-yellow-400 fill-current drop-shadow-sm"
                        : "text-gray-300 hover:text-gray-400"
                    }`}
                  />
                </button>
              ))}
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-gray-600">
                {rating === 0 && "Click to rate"}
                {rating === 1 && "⭐ Very Poor"}
                {rating === 2 && "⭐⭐ Poor"}
                {rating === 3 && "⭐⭐⭐ Average"}
                {rating === 4 && "⭐⭐⭐⭐ Good"}
                {rating === 5 && "⭐⭐⭐⭐⭐ Excellent"}
              </div>
            </div>
          </div>

          {/* Customer Availability */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Was the customer available for delivery?
            </label>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setWasAvailable(true)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                  wasAvailable
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>Yes</span>
              </button>
              <button
                type="button"
                onClick={() => setWasAvailable(false)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                  !wasAvailable
                    ? "border-red-500 bg-red-50 text-red-700"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <UserX className="w-4 h-4" />
                <span>No</span>
              </button>
            </div>
          </div>

          {/* Customer Behavior */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Customer Behavior
            </label>
            <select
              value={behavior}
              onChange={(e) => setBehavior(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select behavior...</option>
              <option value="very polite">Very Polite</option>
              <option value="polite">Polite</option>
              <option value="neutral">Neutral</option>
              <option value="impatient">Impatient</option>
              <option value="rude">Rude</option>
            </select>
          </div>

          {/* Comment */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Additional Comments (Optional)
            </label>
            <div className="relative">
              <MessageSquare className="absolute top-3 left-3 w-4 h-4 text-gray-400" />
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                maxLength={250}
                placeholder="Share your experience with this customer..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
            <div className="text-xs text-gray-500 text-right">
              {comment.length}/250 characters
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || rating === 0}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting...</span>
                </div>
              ) : (
                "Submit Rating"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerRatingModal;
