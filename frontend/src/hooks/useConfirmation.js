import { useState, useCallback } from "react";

export const useConfirmation = () => {
  const [confirmationConfig, setConfirmationConfig] = useState({
    show: false,
    type: "warning",
    title: "",
    message: "",
    confirmText: "Confirm",
    cancelText: "Cancel",
    onConfirm: null,
    onCancel: null,
    confirmButtonClass: "",
    cancelButtonClass: "",
  });

  const showConfirmation = useCallback((config) => {
    return new Promise((resolve) => {
      setConfirmationConfig({
        show: true,
        type: config.type || "warning",
        title: config.title || "Confirm Action",
        message: config.message || "Are you sure you want to proceed?",
        confirmText: config.confirmText || "Confirm",
        cancelText: config.cancelText || "Cancel",
        confirmButtonClass: config.confirmButtonClass || "",
        cancelButtonClass: config.cancelButtonClass || "",
        onConfirm: () => {
          setConfirmationConfig(prev => ({ ...prev, show: false }));
          resolve(true);
        },
        onCancel: () => {
          setConfirmationConfig(prev => ({ ...prev, show: false }));
          resolve(false);
        },
      });
    });
  }, []);

  const hideConfirmation = useCallback(() => {
    setConfirmationConfig(prev => ({ ...prev, show: false }));
  }, []);

  // Convenience methods for different types
  const confirmDanger = useCallback((title, message, options = {}) => {
    return showConfirmation({
      type: "danger",
      title,
      message,
      confirmText: options.confirmText || "Delete",
      ...options,
    });
  }, [showConfirmation]);

  const confirmWarning = useCallback((title, message, options = {}) => {
    return showConfirmation({
      type: "warning",
      title,
      message,
      ...options,
    });
  }, [showConfirmation]);

  const confirmSuccess = useCallback((title, message, options = {}) => {
    return showConfirmation({
      type: "success",
      title,
      message,
      ...options,
    });
  }, [showConfirmation]);

  const confirmInfo = useCallback((title, message, options = {}) => {
    return showConfirmation({
      type: "info",
      title,
      message,
      ...options,
    });
  }, [showConfirmation]);

  return {
    confirmationConfig,
    showConfirmation,
    hideConfirmation,
    confirmDanger,
    confirmWarning,
    confirmSuccess,
    confirmInfo,
  };
};
