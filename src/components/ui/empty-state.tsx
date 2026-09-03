import { Inbox } from "lucide-react";
import { type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: ReactNode;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon,
}: EmptyStateProps) {
  return (
    <Card className="flex flex-col items-center gap-3 px-4 py-8 text-center sm:px-8">
      <div
        className="flex size-11 items-center justify-center rounded-md bg-surface-subtle text-text-muted"
        aria-hidden="true"
      >
        {icon ?? <Inbox className="size-6" />}
      </div>
      <div className="max-w-md space-y-2">
        <h2 className="text-lg font-semibold text-text">{title}</h2>
        <p className="text-sm text-text-muted">{description}</p>
      </div>
      {actionLabel && onAction ? (
        <Button onClick={onAction}>{actionLabel}</Button>
      ) : null}
    </Card>
  );
}
