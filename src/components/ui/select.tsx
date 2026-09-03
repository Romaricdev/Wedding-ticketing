import { forwardRef, type SelectHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  hasError?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, hasError = false, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "flex h-11 min-h-[44px] w-full rounded-md border bg-surface px-3 py-2 text-base text-text transition-[border-color,box-shadow,background-color] duration-150 ease-out",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
        "disabled:cursor-not-allowed disabled:bg-surface-subtle disabled:opacity-60",
        hasError ? "border-danger" : "border-border",
        className,
      )}
      {...props}
    />
  ),
);

Select.displayName = "Select";
