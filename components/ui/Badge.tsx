import React from "react";
import { cn } from "@/lib/utils/helpers";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "primary" | "secondary" | "success" | "warning" | "danger" | "info";
}

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  (
    {
      className,
      variant = "primary",
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors";

    const variants = {
      primary: "bg-primary-100 text-primary-900 dark:bg-primary-900 dark:text-primary-100",
      secondary: "bg-surface-secondary text-foreground border border-border",
      success: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
      warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
      danger: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
      info: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
    };

    return (
      <div
        ref={ref}
        className={cn(baseStyles, variants[variant], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Badge.displayName = "Badge";
