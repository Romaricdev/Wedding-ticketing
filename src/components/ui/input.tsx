import { forwardRef, type InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, hasError = false, type = "text", ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "flex h-11 min-h-[44px] w-full rounded-md border bg-surface px-3 py-2 text-base text-text transition-[border-color,box-shadow,background-color] duration-150 ease-out",
        "placeholder:text-text-muted",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
        "disabled:cursor-not-allowed disabled:bg-surface-subtle disabled:opacity-60",
        hasError ? "border-danger" : "border-border",
        className,
      )}
      {...props}
    />
  ),
);

Input.displayName = "Input";
