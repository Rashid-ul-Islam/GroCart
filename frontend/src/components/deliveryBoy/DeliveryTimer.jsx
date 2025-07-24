import React, { useState, useEffect } from "react";
import { Clock, AlertTriangle, CheckCircle } from "lucide-react";

const DeliveryTimer = ({ estimatedTime, status }) => {
  const [timeLeft, setTimeLeft] = useState(null);
  const [isOverdue, setIsOverdue] = useState(false);

  useEffect(() => {
    if (!estimatedTime || status === "delivery_completed" || status === "payment_received") {
      return;
    }

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const targetTime = new Date(estimatedTime).getTime();
      const difference = targetTime - now;

      if (difference > 0) {
        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ hours, minutes, seconds });
        setIsOverdue(false);
      } else {
        const overdueDifference = Math.abs(difference);
        const hours = Math.floor(overdueDifference / (1000 * 60 * 60));
        const minutes = Math.floor((overdueDifference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((overdueDifference % (1000 * 60)) / 1000);

        setTimeLeft({ hours, minutes, seconds });
        setIsOverdue(true);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [estimatedTime, status]);

  if (!estimatedTime || status === "delivery_completed" || status === "payment_received") {
    return null;
  }

  if (!timeLeft) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
        <Clock className="h-4 w-4 text-gray-500" />
        <span className="text-sm text-gray-600 font-medium">Loading...</span>
      </div>
    );
  }

  const formatTime = (time) => {
    return time.toString().padStart(2, '0');
  };

  const getTimerStyle = () => {
    if (isOverdue) {
      return "bg-gradient-to-r from-red-500 to-red-600 text-white border-red-600 animate-pulse";
    } else if (timeLeft.hours === 0 && timeLeft.minutes <= 30) {
      return "bg-gradient-to-r from-orange-500 to-orange-600 text-white border-orange-600";
    } else {
      return "bg-gradient-to-r from-green-500 to-green-600 text-white border-green-600";
    }
  };

  const getIcon = () => {
    if (isOverdue) {
      return <AlertTriangle className="h-4 w-4" />;
    } else if (timeLeft.hours === 0 && timeLeft.minutes <= 30) {
      return <Clock className="h-4 w-4" />;
    } else {
      return <CheckCircle className="h-4 w-4" />;
    }
  };

  const getStatusText = () => {
    if (isOverdue) {
      return "OVERDUE";
    } else if (timeLeft.hours === 0 && timeLeft.minutes <= 30) {
      return "URGENT";
    } else {
      return "ON TIME";
    }
  };

  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 shadow-lg ${getTimerStyle()}`}>
      {getIcon()}
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-1 font-bold text-lg">
          {timeLeft.hours > 0 && (
            <>
              <span>{formatTime(timeLeft.hours)}</span>
              <span className="text-xs opacity-75">h</span>
            </>
          )}
          <span>{formatTime(timeLeft.minutes)}</span>
          <span className="text-xs opacity-75">m</span>
          <span>{formatTime(timeLeft.seconds)}</span>
          <span className="text-xs opacity-75">s</span>
        </div>
        <div className="text-xs font-semibold opacity-90">
          {isOverdue ? "OVERDUE" : getStatusText()}
        </div>
      </div>
    </div>
  );
};

export default DeliveryTimer;
