import React, { useState, useCallback } from "react";
import ConfirmationModal from "./ConfirmationModal.jsx";

const useConfirmation = () => {
  const [confirmationState, setConfirmationState] = useState({
    show: false,
    type: "warning",
    title: "",
    message: "",
    confirmText: "Confirm",
    cancelText: "Cancel",
    onConfirm: null,
    onCancel: null,
  });

  const showConfirmation = useCallback(
    ({ type = "warning", title, message, confirmText = "Confirm", cancelText = "Cancel" }) => {
      return new Promise((resolve) => {
        setConfirmationState({
          show: true,
          type,
          title,
          message,
          confirmText,
          cancelText,
          onConfirm: () => {
            setConfirmationState(prev => ({ ...prev, show: false }));
            resolve(true);
          },
          onCancel: () => {
            setConfirmationState(prev => ({ ...prev, show: false }));
            resolve(false);
          },
        });
      });
    },
    []
  );

  // Convenience methods for different types
  const confirmDanger = useCallback(
    ({ title, message, confirmText = "Delete", cancelText = "Cancel" }) =>
      showConfirmation({ type: "danger", title, message, confirmText, cancelText }),
    [showConfirmation]
  );

  const confirmWarning = useCallback(
    ({ title, message, confirmText = "Confirm", cancelText = "Cancel" }) =>
      showConfirmation({ type: "warning", title, message, confirmText, cancelText }),
    [showConfirmation]
  );

  const confirmSuccess = useCallback(
    ({ title, message, confirmText = "OK", cancelText = "Cancel" }) =>
      showConfirmation({ type: "success", title, message, confirmText, cancelText }),
    [showConfirmation]
  );

  const confirmInfo = useCallback(
    ({ title, message, confirmText = "OK", cancelText = "Cancel" }) =>
      showConfirmation({ type: "info", title, message, confirmText, cancelText }),
    [showConfirmation]
  );

  const ConfirmationComponent = () => {
    return React.createElement(ConfirmationModal, {
      show: confirmationState.show,
      type: confirmationState.type,
      title: confirmationState.title,
      message: confirmationState.message,
      confirmText: confirmationState.confirmText,
      cancelText: confirmationState.cancelText,
      onConfirm: confirmationState.onConfirm,
      onCancel: confirmationState.onCancel,
    });
  };

  return {
    showConfirmation,
    confirmDanger,
    confirmWarning,
    confirmSuccess,
    confirmInfo,
    ConfirmationComponent,
  };
};

export { useConfirmation };
