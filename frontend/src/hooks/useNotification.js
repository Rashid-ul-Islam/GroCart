import { useState } from 'react';

export const useNotification = () => {
    const [notification, setNotification] = useState({
        show: false,
        type: 'success',
        title: '',
        message: ''
    });

    const showNotification = (type, title, message) => {
        setNotification({
            show: true,
            type,
            title,
            message
        });

        // Auto hide notification after 5 seconds
        setTimeout(() => {
            hideNotification();
        }, 5000);
    };

    const hideNotification = () => {
        setNotification(prev => ({
            ...prev,
            show: false
        }));
    };

    // Convenience methods
    const showSuccess = (title, message) => {
        showNotification('success', title, message);
    };

    const showError = (title, message) => {
        showNotification('error', title, message);
    };

    const showWarning = (title, message) => {
        showNotification('warning', title, message);
    };

    const showInfo = (title, message) => {
        showNotification('info', title, message);
    };

    return {
        notification,
        showNotification,
        hideNotification,
        showSuccess,
        showError,
        showWarning,
        showInfo
    };
};

export default useNotification;
