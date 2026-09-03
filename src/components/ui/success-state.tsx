import { Check } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface SuccessStateDetail {
  label: string;
  value: string;
}

export interface SuccessStateProps {
  title?: string;
  description?: string;
  details?: SuccessStateDetail[];
  actions?: ReactNode;
  className?: string;
}

export function SuccessState({
  title,
  description,
  details,
  actions,
  className,
}: SuccessStateProps) {
  return (
    <div
      className={cn("flex flex-col items-center px-2 py-4 text-center sm:px-4 sm:py-6", className)}
      role="status"
      aria-live="polite"
    >
      <div className="success-icon-ring mb-5 flex size-16 items-center justify-center rounded-full bg-success-subtle">
        <div className="success-icon-pop flex size-11 items-center justify-center rounded-full bg-success text-surface">
          <Check className="size-6" strokeWidth={2.5} aria-hidden="true" />
        </div>
      </div>

      <div className="success-content-in space-y-2">
        {title ? <h3 className="text-lg font-semibold text-text">{title}</h3> : null}
        {description ? <p className="text-sm text-text-muted">{description}</p> : null}
      </div>

      {details && details.length > 0 ? (
        <dl className="success-content-in mt-5 w-full max-w-sm space-y-2 rounded-md border border-border bg-surface-subtle p-4 text-left">
          {details.map((detail) => (
            <div key={detail.label} className="flex items-baseline justify-between gap-4">
              <dt className="text-sm text-text-muted">{detail.label}</dt>
              <dd className="text-sm font-medium tabular-nums text-text">{detail.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {actions ? (
        <div className="success-content-in mt-6 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
