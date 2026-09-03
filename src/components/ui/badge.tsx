import { type HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const variantStyles = {
  neutral: "border-border bg-surface-subtle text-text",
  primary: "border-primary/20 bg-primary-subtle text-text",
  success: "border-success/20 bg-success-subtle text-success",
  warning: "border-warning/20 bg-warning-subtle text-warning",
  danger: "border-danger/20 bg-danger-subtle text-danger",
  info: "border-info/20 bg-surface-subtle text-info",
} as const;

export type BadgeVariant = keyof typeof variantStyles;

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({
  className,
  variant = "neutral",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        variantStyles[variant],
        className,
      )}
      {...props}
    />
  );
}
