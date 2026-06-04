import React from "react";
import { cn } from "@/lib/utils/helpers";
import { useStoreSettings } from "../providers/SettingsProvider";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
  isMoney?: boolean;
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
      isMoney = false,
      onChange,
      onBlur,
      onFocus,
      value,
      defaultValue,
      ...props
    },
    ref,
  ) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const { currencySymbol, currency } = useStoreSettings();

    // For money/number inputs we manage display state internally
    const [displayValue, setDisplayValue] = React.useState<string>(() => {
      const initial = value ?? defaultValue ?? "";
      if (isMoney && initial !== "") {
        return formatMoney(String(initial), currency);
      }
      return String(initial);
    });

    // Track whether the input is focused so the sync effect doesn't
    // clobber what the user is actively typing.
    const isFocusedRef = React.useRef(false);

    // Sync controlled `value` changes from outside (only when not focused)
    React.useEffect(() => {
      if (value === undefined) return; // uncontrolled – skip
      if (isFocusedRef.current) return; // user is typing – don't interfere
      if (isMoney) {
        setDisplayValue(formatMoney(String(value), currency));
      }
    }, [value, isMoney, currency]);

    // ─── Money helpers ──────────────────────────────────────────────────────

    /** Strip everything that isn't a digit or decimal point */
    function stripFormatting(str: string): string {
      return str.replace(/[^0-9.]/g, "");
    }

    /** Format a raw numeric string into locale money display */
    function formatMoney(raw: string, cur: string): string {
      const numeric = parseFloat(raw);
      if (isNaN(numeric)) return raw;
      return new Intl.NumberFormat(undefined, {
        style: "decimal",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(numeric);
    }

    // ─── Event handlers ─────────────────────────────────────────────────────

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let raw = e.target.value;

      if (isMoney) {
        // Strip formatting so we're working with plain numbers
        raw = stripFormatting(raw);
        // Remove leading zeros before a non-zero digit (e.g. "05" → "5")
        raw = raw.replace(/^0+(\d)/, "$1");
        setDisplayValue(raw); // show plain number while typing
        // Emit a synthetic event with the raw numeric value
        const syntheticEvent = {
          ...e,
          target: { ...e.target, value: raw },
        } as React.ChangeEvent<HTMLInputElement>;
        onChange?.(syntheticEvent);
        return;
      }

      if (type === "number" || props.inputMode === "numeric") {
        // Replace leading zero: "05" → "5"
        raw = raw.replace(/^0+(\d)/, "$1");
        setDisplayValue(raw);
        const syntheticEvent = {
          ...e,
          target: { ...e.target, value: raw },
        } as React.ChangeEvent<HTMLInputElement>;
        onChange?.(syntheticEvent);
        return;
      }

      onChange?.(e);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      isFocusedRef.current = true;
      if (isMoney) {
        // Strip formatting on focus so the user edits a plain number
        const raw = stripFormatting(displayValue);
        setDisplayValue(raw === "0.00" || raw === "0" ? "" : raw);
      }
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      isFocusedRef.current = false;
      if (isMoney) {
        const raw = stripFormatting(displayValue);
        if (raw === "" || raw === ".") {
          setDisplayValue("");
        } else {
          setDisplayValue(formatMoney(raw, currency));
        }
      }
      onBlur?.(e);
    };

    // ─── Determine effective props ───────────────────────────────────────────

    const isMoneyOrNumber = isMoney || type === "number";

    // For money we render as text so Intl formatting works freely
    const effectiveType = isMoney ? "text" : type;
    const effectiveInputMode = isMoney
      ? "decimal"
      : (props.inputMode ?? (type === "number" ? "numeric" : undefined));

    const effectiveLeftIcon = isMoney ? (
      <span className="text-sm font-medium">{currencySymbol}</span>
    ) : (
      leftIcon
    );

    // Controlled vs uncontrolled
    const valueProps = isMoneyOrNumber
      ? { value: displayValue }
      : value !== undefined
        ? { value }
        : { defaultValue };

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
          {effectiveLeftIcon && (
            <span className="absolute left-3.5 text-muted-foreground flex items-center justify-center pointer-events-none">
              {effectiveLeftIcon}
            </span>
          )}
          <input
            id={inputId}
            type={effectiveType}
            inputMode={effectiveInputMode}
            ref={ref}
            className={cn(
              "w-full px-4 py-2.5 rounded-lg border bg-input-bg text-foreground placeholder:text-muted transition-all duration-200 outline-none",
              "border-border focus:border-primary-500 focus:ring-4 focus:ring-ring",
              effectiveLeftIcon && "pl-11",
              rightIcon && "pr-11",
              error &&
                "border-error-500 focus:border-error-500 focus:ring-error-50/50 dark:focus:ring-error-500/10",
              className,
            )}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...valueProps}
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
  },
);

Input.displayName = "Input";
