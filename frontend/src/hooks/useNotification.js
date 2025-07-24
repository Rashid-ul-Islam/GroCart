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

    return {
        notification,
        showNotification,
        hideNotification,
        showSuccess,
        showError
    };
};
