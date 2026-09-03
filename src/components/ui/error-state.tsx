import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorState({
  title = "Une erreur est survenue",
  message,
  onRetry,
  retryLabel = "Réessayer",
}: ErrorStateProps) {
  return (
    <Card
      className="flex flex-col items-start gap-4 border-danger/20 bg-danger-subtle p-4 sm:p-6"
      role="alert"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 size-5 shrink-0 text-danger" aria-hidden="true" />
        <div className="space-y-1">
          <h2 className="font-semibold text-danger">{title}</h2>
          <p className="text-sm text-text">{message}</p>
        </div>
      </div>
      {onRetry ? (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          {retryLabel}
        </Button>
      ) : null}
    </Card>
  );
}
