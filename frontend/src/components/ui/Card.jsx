import React from "react";
import clsx from "clsx";

// Card container
export function Card({ className, children, ...props }) {
  return (
    <div
      className={clsx(
        "rounded-xl border border-gray-700 bg-gray-800 shadow-md overflow-hidden",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// Card header (optional)
export function CardHeader({ className, children, ...props }) {
  return (
    <div
      className={clsx("px-4 py-3 border-b border-gray-700", className)}
      {...props}
    >
      {children}
    </div>
  );
}

// Card content
export function CardContent({ className, children, ...props }) {
  return (
    <div className={clsx("p-4", className)} {...props}>
      {children}
    </div>
  );
}

// Card footer (optional)
export function CardFooter({ className, children, ...props }) {
  return (
    <div
      className={clsx("px-4 py-3 border-t border-gray-700", className)}
      {...props}
    >
      {children}
    </div>
  );
}
