import * as React from "react";

const Label = React.forwardRef(({ className, ...props }, ref) => {
  const baseClasses = "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70";
  const finalClasses = className ? `${baseClasses} ${className}` : baseClasses;
  
  return (
    <label
      ref={ref}
      className={finalClasses}
      {...props}
    />
  );
});
Label.displayName = "Label";

export { Label };
