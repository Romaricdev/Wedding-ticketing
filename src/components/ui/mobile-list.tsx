import { ChevronRight } from "lucide-react";
import { type ReactNode } from "react";

import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

export interface MobileListItem {
  id: string;
  title: string;
  subtitle?: string;
  meta?: ReactNode;
  badges?: ReactNode;
  href?: string;
  onClick?: () => void;
}

export interface MobileListProps {
  items: MobileListItem[];
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}

export function MobileList({
  items,
  emptyTitle = "Aucun élément",
  emptyDescription = "Aucun élément à afficher pour le moment.",
  className,
}: MobileListProps) {
  if (items.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <ul className={cn("space-y-3", className)}>
      {items.map((item) => {
        const content = (
          <>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="font-medium text-text">{item.title}</p>
              {item.subtitle ? (
                <p className="text-sm text-text-muted">{item.subtitle}</p>
              ) : null}
              {item.badges ? (
                <div className="flex flex-wrap gap-2 pt-1">{item.badges}</div>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {item.meta}
              {item.href || item.onClick ? (
                <ChevronRight className="size-4 text-text-muted" aria-hidden="true" />
              ) : null}
            </div>
          </>
        );

        if (item.href) {
          return (
            <li key={item.id}>
              <a
                href={item.href}
                className="flex min-h-[44px] items-center gap-3 rounded-sm border border-border bg-surface p-4 transition-colors hover:bg-surface-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                {content}
              </a>
            </li>
          );
        }

        return (
          <li key={item.id}>
            {item.onClick ? (
              <button
                type="button"
                onClick={item.onClick}
                className="flex min-h-[44px] w-full items-center gap-3 rounded-sm border border-border bg-surface p-4 text-left transition-colors hover:bg-surface-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                {content}
              </button>
            ) : (
              <Card className="flex items-center gap-3 p-4">{content}</Card>
            )}
          </li>
        );
      })}
    </ul>
  );
}
