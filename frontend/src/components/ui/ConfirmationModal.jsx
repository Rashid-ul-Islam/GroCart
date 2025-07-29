import React from "react";
import { XCircle, AlertTriangle, CheckCircle, Info, X } from "lucide-react";
import { Button } from "./button.jsx";

const ConfirmationModal = ({
  show,
  type = "warning", // 'warning', 'danger', 'success', 'info'
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  confirmButtonClass = "",
  cancelButtonClass = "",
}) => {
  if (!show) return null;

  const getIcon = () => {
    switch (type) {
      case "danger":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "info":
        return <Info className="w-5 h-5 text-blue-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
    }
  };

  const getConfirmButtonStyle = () => {
    if (confirmButtonClass) return confirmButtonClass;
    
    switch (type) {
      case "danger":
        return "bg-red-500 hover:bg-red-600 text-white";
      case "warning":
        return "bg-orange-500 hover:bg-orange-600 text-white";
      case "success":
        return "bg-green-500 hover:bg-green-600 text-white";
      case "info":
        return "bg-blue-500 hover:bg-blue-600 text-white";
      default:
        return "bg-orange-500 hover:bg-orange-600 text-white";
    }
  };

  const getCancelButtonStyle = () => {
    if (cancelButtonClass) return cancelButtonClass;
    return "bg-gray-500 hover:bg-gray-600 text-white";
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full animate-in fade-in-0 zoom-in-95 duration-300">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              {getIcon()}
              {title}
            </h3>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          <p className="text-gray-700 text-sm leading-relaxed">{message}</p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <Button
            onClick={onCancel}
            className={`px-4 py-2 rounded-lg transition duration-200 ${getCancelButtonStyle()}`}
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg transition duration-200 ${getConfirmButtonStyle()}`}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
