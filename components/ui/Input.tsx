import React from "react";
import { cn } from "@/lib/utils/helpers";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      leftIcon,
      rightIcon,
      type = "text",
      containerClassName,
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <div className={cn("flex flex-col gap-1.5 w-full", containerClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3.5 text-muted-foreground flex items-center justify-center pointer-events-none">
              {leftIcon}
            </span>
          )}
          <input
            id={inputId}
            type={type}
            ref={ref}
            className={cn(
              "w-full px-4 py-2.5 rounded-lg border bg-input-bg text-foreground placeholder:text-muted transition-all duration-200 outline-none",
              "border-border focus:border-primary-500 focus:ring-4 focus:ring-ring",
              leftIcon && "pl-11",
              rightIcon && "pr-11",
              error && "border-error-500 focus:border-error-500 focus:ring-error-50/50 dark:focus:ring-error-500/10",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3.5 text-muted-foreground flex items-center justify-center">
              {rightIcon}
            </span>
          )}
        </div>
        {error && (
          <span className="text-xs text-error-600 animate-slide-down font-medium">
            {error}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
