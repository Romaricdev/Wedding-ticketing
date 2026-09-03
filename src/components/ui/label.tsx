import { type LabelHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export function Label({
  className,
  children,
  required = false,
  ...props
}: LabelProps) {
  return (
    <label
      className={cn("block text-sm font-medium text-text", className)}
      {...props}
    >
      {children}
      {required ? (
        <span className="ml-1 text-danger" aria-hidden="true">
          *
        </span>
      ) : null}
      {required ? <span className="sr-only"> (obligatoire)</span> : null}
    </label>
  );
}
