import React, { cloneElement } from "react";

export function DropdownMenu({ children }) {
  return <div className="relative inline-block text-left">{children}</div>;
}

export function DropdownMenuTrigger({ children, asChild }) {
  return asChild ? cloneElement(children) : <button>{children}</button>;
}

export function DropdownMenuContent({ children }) {
  return (
    <div className="absolute mt-2 w-48 bg-white border border-gray-300 rounded shadow-md z-50">
      {children}
    </div>
  );
}

export function DropdownMenuItem({ children, onClick }) {
  return (
    <div
      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
      onClick={onClick}
    >
      {children}
    </div>
  );
}
