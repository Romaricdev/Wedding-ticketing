import { type ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

export interface FormFieldProps {
  label: string;
  htmlFor: string;
  required?: boolean;
  help?: string;
  error?: string;
  className?: string;
  children: ReactNode;
}

export function FormField({
  label,
  htmlFor,
  required = false,
  help,
  error,
  className,
  children,
}: FormFieldProps) {
  const helpId = help ? `${htmlFor}-help` : undefined;
  const errorId = error ? `${htmlFor}-error` : undefined;
  const describedBy = [helpId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={htmlFor} required={required}>
        {label}
      </Label>
      <div
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        className="contents"
      >
        {children}
      </div>
      {help ? (
        <p id={helpId} className="text-sm text-text-muted">
          {help}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
