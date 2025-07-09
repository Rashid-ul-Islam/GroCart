import React, { useState, useEffect } from "react";
import { CheckCircle, XCircle, AlertCircle, Info, X } from "lucide-react";

const Toast = ({ message, type = "info", duration = 3000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for animation to complete
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getToastStyles = () => {
    const baseStyles =
      "flex items-center p-4 rounded-lg shadow-lg transition-all duration-300 transform";
    const visibilityStyles = isVisible
      ? "translate-x-0 opacity-100"
      : "translate-x-full opacity-0";

    switch (type) {
      case "success":
        return `${baseStyles} ${visibilityStyles} bg-green-50 border-l-4 border-green-400 text-green-800`;
      case "error":
        return `${baseStyles} ${visibilityStyles} bg-red-50 border-l-4 border-red-400 text-red-800`;
      case "warning":
        return `${baseStyles} ${visibilityStyles} bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800`;
      default:
        return `${baseStyles} ${visibilityStyles} bg-blue-50 border-l-4 border-blue-400 text-blue-800`;
    }
  };

  const getIcon = () => {
    const iconProps = { className: "w-5 h-5 mr-3 flex-shrink-0" };

    switch (type) {
      case "success":
        return (
          <CheckCircle
            {...iconProps}
            className="w-5 h-5 mr-3 flex-shrink-0 text-green-500"
          />
        );
      case "error":
        return (
          <XCircle
            {...iconProps}
            className="w-5 h-5 mr-3 flex-shrink-0 text-red-500"
          />
        );
      case "warning":
        return (
          <AlertCircle
            {...iconProps}
            className="w-5 h-5 mr-3 flex-shrink-0 text-yellow-500"
          />
        );
      default:
        return (
          <Info
            {...iconProps}
            className="w-5 h-5 mr-3 flex-shrink-0 text-blue-500"
          />
        );
    }
  };

  return (
    <div className={getToastStyles()}>
      {getIcon()}
      <span className="flex-1 text-sm font-medium">{message}</span>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(onClose, 300);
        }}
        className="ml-4 text-current opacity-70 hover:opacity-100 transition-opacity"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

// Hook for managing toasts
export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = "info", duration = 3000) => {
    const id = Date.now() + Math.random();
    const newToast = { id, message, type, duration };

    setToasts((prev) => [...prev, newToast]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const ToastComponent = () => (
    <ToastContainer toasts={toasts} removeToast={removeToast} />
  );

  return {
    addToast,
    ToastComponent,
  };
};

export default Toast;
