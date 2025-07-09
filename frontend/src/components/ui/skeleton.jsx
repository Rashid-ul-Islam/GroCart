import React from "react";

const Skeleton = ({
  className = "",
  variant = "rectangular",
  animation = "pulse",
}) => {
  const baseClasses = "bg-gray-200 rounded";
  const animationClasses = {
    pulse: "animate-pulse",
    wave: "animate-bounce",
    none: "",
  };

  const variantClasses = {
    rectangular: "",
    circular: "rounded-full",
    text: "rounded-md h-4",
  };

  return (
    <div
      className={`${baseClasses} ${animationClasses[animation]} ${variantClasses[variant]} ${className}`}
    />
  );
};

export const OrderCardSkeleton = () => (
  <div className="p-6 border border-gray-200 rounded-lg animate-pulse">
    <div className="flex justify-between items-start mb-4">
      <div className="space-y-2">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="space-y-2 text-right">
        <Skeleton className="h-6 w-20 ml-auto" />
        <Skeleton className="h-8 w-16 ml-auto" />
      </div>
    </div>

    <div className="space-y-3 mb-4">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>

    <div className="border-t pt-4">
      <div className="flex justify-between items-center mb-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-24" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center space-x-2">
            <Skeleton variant="circular" className="w-8 h-8" />
            <Skeleton className="h-3 flex-1" />
          </div>
        ))}
      </div>
    </div>

    <div className="border-t pt-4 mt-4">
      <div className="flex space-x-2">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 flex-1" />
      </div>
    </div>
  </div>
);

export const OrderDetailsSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="flex justify-between items-start">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="h-8 w-8" />
    </div>

    <div className="grid md:grid-cols-2 gap-6">
      <div className="p-4 border rounded-lg space-y-3">
        <Skeleton className="h-5 w-32" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>

      <div className="p-4 border rounded-lg space-y-3">
        <Skeleton className="h-5 w-36" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-8 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    </div>

    <div className="p-4 border rounded-lg">
      <Skeleton className="h-5 w-24 mb-4" />
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between p-3 border rounded-lg"
          >
            <div className="flex items-center space-x-4">
              <Skeleton variant="circular" className="w-16 h-16" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
            <div className="flex space-x-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-28" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default Skeleton;
