import React from "react";
import { cn } from "@/lib/utils/helpers";
import { LoadingSpinner } from "./LoadingSpinner";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "accent"
    | "danger"
    | "ghost"
    | "outline"
    | "green";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  iconOnly?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";

    const variants = {
      primary:
        "bg-primary-500 hover:bg-primary-600 text-white shadow-soft hover:shadow-card focus-visible:outline-primary-500 active:scale-[0.98]",
      secondary:
        "bg-surface-secondary hover:bg-border text-foreground border border-border focus-visible:outline-neutral-500 active:scale-[0.98]",
      accent:
        "bg-accent-500 hover:bg-accent-600 text-white shadow-soft hover:shadow-card focus-visible:outline-accent-500 active:scale-[0.98]",
      danger:
        "bg-error-500 hover:bg-error-600 text-white shadow-soft focus-visible:outline-error-500 active:scale-[0.98]",
      ghost: "hover:bg-surface-secondary text-foreground",
      outline:
        "border border-border hover:bg-surface-secondary text-foreground",
      green:
        "bg-green-600 hover:bg-green-700 hover:border-green-700 text-white uppercase font-bold tracking-wider h-14",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-xs",
      md: "px-4 py-2 text-sm",
      lg: "px-6 py-3 text-base",
      icon: "p-2",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && (
          <LoadingSpinner size="sm" className="mr-2 border-current" />
        )}
        {!isLoading && leftIcon && <span className="mr-1.5">{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span className="ml-1.5">{rightIcon}</span>}
      </button>
    );
  },
);

Button.displayName = "Button";
