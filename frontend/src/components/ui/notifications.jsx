import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  X, 
  Info, 
  AlertTriangle, 
  XCircle,
  Sparkles,
  Zap,
  Trophy,
  Gift,
  Heart,
  Star
} from 'lucide-react';

// Main Notification Component
export const Notification = ({ 
  type = 'success',
  title,
  message,
  duration = 5000,
  position = 'top-right',
  onClose,
  showProgress = true,
  icon: CustomIcon,
  animation = 'slide',
  size = 'medium'
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (duration > 0) {
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev - (100 / (duration / 100));
          return newProgress <= 0 ? 0 : newProgress;
        });
      }, 100);

      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose?.(), 300);
      }, duration);

      return () => {
        clearInterval(progressInterval);
        clearTimeout(timer);
      };
    }
  }, [duration, onClose]);

  const typeConfig = {
    success: {
      bgColor: 'bg-gradient-to-r from-emerald-500 to-green-600',
      textColor: 'text-white',
      iconColor: 'text-emerald-100',
      progressColor: 'bg-emerald-200',
      icon: CheckCircle,
      borderColor: 'border-emerald-400'
    },
    error: {
      bgColor: 'bg-gradient-to-r from-red-500 to-red-600',
      textColor: 'text-white',
      iconColor: 'text-red-100',
      progressColor: 'bg-red-200',
      icon: XCircle,
      borderColor: 'border-red-400'
    },
    warning: {
      bgColor: 'bg-gradient-to-r from-amber-500 to-orange-600',
      textColor: 'text-white',
      iconColor: 'text-amber-100',
      progressColor: 'bg-amber-200',
      icon: AlertTriangle,
      borderColor: 'border-amber-400'
    },
    info: {
      bgColor: 'bg-gradient-to-r from-blue-500 to-indigo-600',
      textColor: 'text-white',
      iconColor: 'text-blue-100',
      progressColor: 'bg-blue-200',
      icon: Info,
      borderColor: 'border-blue-400'
    }
  };

  const sizeConfig = {
    small: 'p-3 text-sm max-w-sm',
    medium: 'p-4 text-base max-w-md',
    large: 'p-6 text-lg max-w-lg'
  };

  const positionConfig = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2',
    'center': 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
  };

  const animationConfig = {
    slide: isVisible 
      ? 'translate-x-0 opacity-100 scale-100' 
      : 'translate-x-full opacity-0 scale-95',
    fade: isVisible 
      ? 'opacity-100 scale-100' 
      : 'opacity-0 scale-95',
    bounce: isVisible 
      ? 'translate-y-0 opacity-100 scale-100' 
      : '-translate-y-2 opacity-0 scale-95',
    zoom: isVisible 
      ? 'scale-100 opacity-100' 
      : 'scale-75 opacity-0'
  };

  const config = typeConfig[type];
  const IconComponent = CustomIcon || config.icon;

  return (
    <div 
      className={`
        fixed z-50 ${positionConfig[position]} 
        ${sizeConfig[size]}
        transform transition-all duration-300 ease-in-out
        ${animationConfig[animation]}
      `}
    >
      <div 
        className={`
          ${config.bgColor} ${config.textColor}
          rounded-xl shadow-2xl backdrop-blur-sm
          border ${config.borderColor}
          relative overflow-hidden
        `}
      >
        {/* Sparkle Background Effect */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-2 left-2 w-1 h-1 bg-white rounded-full animate-pulse"></div>
          <div className="absolute top-4 right-6 w-1 h-1 bg-white rounded-full animate-pulse delay-300"></div>
          <div className="absolute bottom-3 left-6 w-1 h-1 bg-white rounded-full animate-pulse delay-700"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-start gap-3">
            <div className={`${config.iconColor} mt-0.5 animate-bounce`}>
              <IconComponent className="w-6 h-6" />
            </div>
            
            <div className="flex-1 min-w-0">
              {title && (
                <h4 className="font-bold text-lg mb-1 leading-tight">
                  {title}
                </h4>
              )}
              {message && (
                <p className="opacity-90 leading-relaxed">
                  {message}
                </p>
              )}
            </div>
            
            <button
              onClick={() => {
                setIsVisible(false);
                setTimeout(() => onClose?.(), 300);
              }}
              className="opacity-70 hover:opacity-100 transition-opacity ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Bar */}
          {showProgress && duration > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1">
              <div className="w-full bg-black bg-opacity-20 h-full">
                <div 
                  className={`h-full ${config.progressColor} transition-all duration-100 ease-linear`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Notification Manager Hook
export const useNotification = () => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (notification) => {
    const id = Date.now() + Math.random();
    const newNotification = { ...notification, id };
    
    setNotifications(prev => [...prev, newNotification]);
    
    return id;
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const success = (message, options = {}) => {
    return addNotification({
      type: 'success',
      message,
      title: options.title || 'Success!',
      ...options
    });
  };

  const error = (message, options = {}) => {
    return addNotification({
      type: 'error',
      message,
      title: options.title || 'Error!',
      ...options
    });
  };

  const warning = (message, options = {}) => {
    return addNotification({
      type: 'warning',
      message,
      title: options.title || 'Warning!',
      ...options
    });
  };

  const info = (message, options = {}) => {
    return addNotification({
      type: 'info',
      message,
      title: options.title || 'Info',
      ...options
    });
  };

  const clear = () => {
    setNotifications([]);
  };

  return {
    notifications,
    success,
    error,
    warning,
    info,
    clear,
    removeNotification
  };
};

// Notification Container Component
export const NotificationContainer = ({ notifications, removeNotification }) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {notifications.map((notification, index) => (
        <div 
          key={notification.id}
          style={{ zIndex: 50 + index }}
          className="pointer-events-auto"
        >
          <Notification
            {...notification}
            onClose={() => removeNotification(notification.id)}
          />
        </div>
      ))}
    </div>
  );
};

// Demo Component
export const NotificationDemo = () => {
  const { notifications, success, error, warning, info, clear, removeNotification } = useNotification();

  const showSuccessMessage = () => {
    success('Address hierarchy created successfully!', {
      title: '🎉 Success!',
      duration: 4000,
      icon: Trophy,
      animation: 'bounce'
    });
  };

  const showErrorMessage = () => {
    error('Failed to create address. Please try again.', {
      title: '❌ Oops!',
      duration: 5000,
      animation: 'slide'
    });
  };

  const showWarningMessage = () => {
    warning('Some fields are missing. Please check your input.', {
      title: '⚠️ Almost there!',
      duration: 4000,
      icon: AlertTriangle,
      animation: 'fade'
    });
  };

  const showInfoMessage = () => {
    info('Your data has been saved automatically.', {
      title: '💡 Did you know?',
      duration: 3000,
      icon: Sparkles,
      animation: 'zoom'
    });
  };

  const showCustomMessage = () => {
    success('You earned 50 points!', {
      title: '🏆 Achievement Unlocked!',
      duration: 6000,
      icon: Gift,
      position: 'center',
      size: 'large',
      animation: 'bounce'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">
          🎨 Cool Notification System
        </h1>
        
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Try Different Notifications</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <button
              onClick={showSuccessMessage}
              className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              ✨ Success Message
            </button>
            
            <button
              onClick={showErrorMessage}
              className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              ❌ Error Message
            </button>
            
            <button
              onClick={showWarningMessage}
              className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              ⚠️ Warning Message
            </button>
            
            <button
              onClick={showInfoMessage}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              💡 Info Message
            </button>
            
            <button
              onClick={showCustomMessage}
              className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              🏆 Custom Message
            </button>
            
            <button
              onClick={clear}
              className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              🗑️ Clear All
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Usage Examples</h2>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-gray-700 mb-2">Basic Usage:</h3>
            <pre className="text-sm text-gray-600 overflow-x-auto">
{`const { success, error, warning, info } = useNotification();

// Simple success message
success('Operation completed successfully!');

// Custom success with options
success('Address created!', {
  title: '🎉 Success!',
  duration: 4000,
  icon: Trophy,
  animation: 'bounce',
  position: 'top-center'
});`}
            </pre>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-700 mb-2">Available Options:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li><strong>type:</strong> 'success', 'error', 'warning', 'info'</li>
              <li><strong>title:</strong> Custom title text</li>
              <li><strong>message:</strong> Main notification message</li>
              <li><strong>duration:</strong> Auto-hide duration (0 for persistent)</li>
              <li><strong>position:</strong> 'top-right', 'top-left', 'center', etc.</li>
              <li><strong>animation:</strong> 'slide', 'fade', 'bounce', 'zoom'</li>
              <li><strong>size:</strong> 'small', 'medium', 'large'</li>
              <li><strong>icon:</strong> Custom Lucide React icon component</li>
            </ul>
          </div>
        </div>
      </div>

      <NotificationContainer 
        notifications={notifications} 
        removeNotification={removeNotification} 
      />
    </div>
  );
};