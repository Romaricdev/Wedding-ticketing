import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

const variantStyles = {
  primary:
    "bg-primary text-white hover:bg-primary-hover disabled:bg-primary/50",
  secondary:
    "border border-border bg-surface text-text hover:bg-surface-subtle disabled:opacity-50",
  ghost:
    "bg-transparent text-text hover:bg-surface-subtle disabled:opacity-50",
  danger:
    "bg-danger text-white hover:bg-danger/90 disabled:bg-danger/50",
} as const;

const sizeStyles = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 min-h-[44px] px-4 text-sm sm:text-base",
  lg: "h-12 min-h-[44px] px-6 text-base",
} as const;

export type ButtonVariant = keyof typeof variantStyles;
export type ButtonSize = keyof typeof sizeStyles;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      type = "button",
      disabled,
      loading = false,
      icon,
      children,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-sm font-semibold transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out active:translate-y-px",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
          "disabled:cursor-not-allowed",
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        {...props}
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : icon ? (
          icon
        ) : null}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
