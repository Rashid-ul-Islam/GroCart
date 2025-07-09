import React from "react";
import { Package, Clock, CheckCircle, Truck, MapPin } from "lucide-react";

const OrderTracker = ({ order }) => {
  const getOrderSteps = () => {
    const baseSteps = [
      {
        key: "confirmed",
        label: "Order Confirmed",
        icon: CheckCircle,
        description: "Your order has been confirmed",
      },
      {
        key: "preparing",
        label: "Preparing",
        icon: Package,
        description: "Your order is being prepared",
      },
      {
        key: "in_transit",
        label: "In Transit",
        icon: Truck,
        description: "Your order is on the way",
      },
      {
        key: "delivered",
        label: "Delivered",
        icon: MapPin,
        description: "Your order has been delivered",
      },
    ];

    if (order.status === "cancelled") {
      return [
        {
          key: "confirmed",
          label: "Order Confirmed",
          icon: CheckCircle,
          description: "Your order was confirmed",
        },
        {
          key: "cancelled",
          label: "Cancelled",
          icon: Clock,
          description: order.cancellation_reason || "Order was cancelled",
        },
      ];
    }

    return baseSteps;
  };

  const getCurrentStepIndex = () => {
    const steps = getOrderSteps();
    return steps.findIndex((step) => step.key === order.status);
  };

  const steps = getOrderSteps();
  const currentStepIndex = getCurrentStepIndex();

  return (
    <div className="w-full">
      <div className="flex items-center justify-between relative">
        {/* Progress Line */}
        <div className="absolute top-6 left-0 right-0 h-0.5 bg-gray-200 z-0">
          <div
            className="h-full bg-purple-600 transition-all duration-500 ease-in-out"
            style={{
              width:
                currentStepIndex >= 0
                  ? `${(currentStepIndex / (steps.length - 1)) * 100}%`
                  : "0%",
            }}
          />
        </div>

        {/* Steps */}
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = index <= currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const isCancelled =
            order.status === "cancelled" && step.key === "cancelled";

          return (
            <div
              key={step.key}
              className="flex flex-col items-center relative z-10"
            >
              {/* Step Circle */}
              <div
                className={`
                  w-12 h-12 rounded-full border-4 flex items-center justify-center transition-all duration-300
                  ${
                    isCompleted || isCurrent
                      ? isCancelled
                        ? "bg-red-500 border-red-500 text-white"
                        : "bg-purple-600 border-purple-600 text-white"
                      : "bg-white border-gray-300 text-gray-400"
                  }
                  ${isCurrent ? "scale-110 shadow-lg" : ""}
                `}
              >
                <Icon className="w-5 h-5" />
              </div>

              {/* Step Label */}
              <div className="mt-3 text-center">
                <p
                  className={`
                  text-sm font-medium transition-colors duration-300
                  ${
                    isCompleted || isCurrent
                      ? isCancelled
                        ? "text-red-600"
                        : "text-purple-600"
                      : "text-gray-400"
                  }
                `}
                >
                  {step.label}
                </p>
                <p className="text-xs text-gray-500 mt-1 max-w-20 leading-tight">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Additional Info */}
      {order.estimated_delivery &&
        order.status !== "delivered" &&
        order.status !== "cancelled" && (
          <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center text-blue-800">
              <Clock className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">
                Estimated Delivery:{" "}
                {new Date(order.estimated_delivery).toLocaleDateString(
                  "en-US",
                  {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                )}
              </span>
            </div>
          </div>
        )}

      {order.actual_delivery && order.status === "delivered" && (
        <div className="mt-6 p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center text-green-800">
            <CheckCircle className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">
              Delivered on:{" "}
              {new Date(order.actual_delivery).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
      )}

      {order.tracking_number && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Tracking Number:</span>
            <span className="text-sm font-mono font-medium text-gray-900">
              {order.tracking_number}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderTracker;
