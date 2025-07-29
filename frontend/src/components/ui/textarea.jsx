import * as React from "react";

const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  const baseClasses = "flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50";
  const finalClasses = className ? `${baseClasses} ${className}` : baseClasses;
  
  return (
    <textarea
      className={finalClasses}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
