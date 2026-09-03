import { type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface FilterBarProps {
  children: ReactNode;
  resultCount?: number;
  resultLabel?: string;
  onReset?: () => void;
  resetLabel?: string;
  className?: string;
}

export function FilterBar({
  children,
  resultCount,
  resultLabel = "résultats",
  onReset,
  resetLabel = "Réinitialiser les filtres",
  className,
}: FilterBarProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-sm border border-border bg-surface p-3",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-3">{children}</div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
        {typeof resultCount === "number" ? (
          <p className="text-sm text-text-muted tabular-nums">
            {resultCount} {resultLabel}
          </p>
        ) : (
          <span />
        )}
        {onReset ? (
          <Button type="button" variant="ghost" size="sm" onClick={onReset}>
            {resetLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
