import React, { useEffect } from "react";
import { CheckCircle, XCircle, X } from "lucide-react";

const Notification = ({ show, type = "success", title, message, onClose }) => {
  useEffect(() => {
    // Add custom CSS to document head if not already present
    if (!document.getElementById("notification-styles")) {
      const style = document.createElement("style");
      style.id = "notification-styles";
      style.textContent = `
        @keyframes slideInFromTop {
          0% {
            transform: translateX(-50%) translateY(-120px) scale(0.9);
            opacity: 0;
            filter: blur(4px);
          }
          50% {
            transform: translateX(-50%) translateY(-10px) scale(1.02);
            opacity: 0.8;
            filter: blur(1px);
          }
          80% {
            transform: translateX(-50%) translateY(5px) scale(1.01);
            opacity: 0.95;
            filter: blur(0px);
          }
          100% {
            transform: translateX(-50%) translateY(0) scale(1);
            opacity: 1;
            filter: blur(0px);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.9;
          }
        }
        
        @keyframes glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
          }
          50% {
            box-shadow: 0 0 40px rgba(59, 130, 246, 0.6);
          }
        }
        
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        
        .notification-enter {
          animation: slideInFromTop 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
        
        .notification-icon-pulse {
          animation: pulse 2s ease-in-out infinite;
        }
        
        .notification-glow {
          animation: glow 3s ease-in-out infinite;
        }
        
        .notification-shimmer {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
          background-size: 200% 100%;
          animation: shimmer 2s linear infinite;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  if (!show) return null;

  const getNotificationStyles = () => {
    switch (type) {
      case "success":
        return {
          bgColor: "bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50",
          borderColor: "border-emerald-400",
          iconBg: "bg-gradient-to-br from-emerald-100 to-green-200",
          iconColor: "text-emerald-600",
          titleColor: "text-emerald-800",
          glowColor: "shadow-emerald-500/30",
          icon: CheckCircle,
        };
      case "error":
        return {
          bgColor: "bg-gradient-to-br from-red-50 via-rose-50 to-pink-50",
          borderColor: "border-red-400",
          iconBg: "bg-gradient-to-br from-red-100 to-rose-200",
          iconColor: "text-red-600",
          titleColor: "text-red-800",
          glowColor: "shadow-red-500/30",
          icon: XCircle,
        };
      default:
        return {
          bgColor: "bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50",
          borderColor: "border-emerald-400",
          iconBg: "bg-gradient-to-br from-emerald-100 to-green-200",
          iconColor: "text-emerald-600",
          titleColor: "text-emerald-800",
          glowColor: "shadow-emerald-500/30",
          icon: CheckCircle,
        };
    }
  };

  const styles = getNotificationStyles();
  const IconComponent = styles.icon;

  return (
    <div className="fixed top-4 left-1/2 z-50 pointer-events-none">
      <div
        className={`bg-white rounded-xl shadow-2xl max-w-md w-full transition-all duration-500 ease-in-out pointer-events-auto border-2 ${styles.borderColor} ${styles.glowColor} notification-enter backdrop-blur-sm relative overflow-hidden`}
        style={{
          minWidth: "400px",
          transform: "translateX(-50%)",
          boxShadow: `0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05), ${styles.glowColor.includes('emerald') ? '0 0 30px rgba(16, 185, 129, 0.3)' : '0 0 30px rgba(239, 68, 68, 0.3)'}`,
        }}
      >
        {/* Shimmer overlay */}
        <div className="absolute inset-0 notification-shimmer pointer-events-none" />
        
        <div className={`px-6 py-5 rounded-t-xl relative ${styles.bgColor}`}>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div
                className={`w-10 h-10 ${styles.iconBg} rounded-full flex items-center justify-center notification-icon-pulse shadow-lg ring-2 ring-white`}
              >
                <IconComponent className={`w-6 h-6 ${styles.iconColor} drop-shadow-sm`} />
              </div>
            </div>
            <div className="ml-4 flex-1">
              <h3 className={`text-xl font-bold ${styles.titleColor} drop-shadow-sm`}>
                {title}
              </h3>
              <p className="mt-2 text-sm text-gray-700 leading-relaxed font-medium">
                {message}
              </p>
            </div>
            <div className="ml-4 flex-shrink-0">
              <button
                onClick={onClose}
                className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition-all ease-in-out duration-200 rounded-full p-2 hover:bg-white/60 hover:shadow-md hover:scale-110 active:scale-95 backdrop-blur-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notification;