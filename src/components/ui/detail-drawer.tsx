"use client";

import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { ModalPortal } from "@/components/ui/modal-portal";
import { cn } from "@/lib/utils";

export interface DetailDrawerProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

export function DetailDrawer({
  open,
  title,
  description,
  onClose,
  children,
  footer,
}: DetailDrawerProps) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <ModalPortal>
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-text/40"
        aria-label="Fermer le panneau"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-drawer-title"
        className={cn(
          "relative z-10 flex h-full w-full max-w-lg flex-col border-l border-border bg-surface shadow-overlay",
          "max-md:max-w-none",
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border p-4 sm:p-6">
          <div className="space-y-1">
            <h2 id="detail-drawer-title" className="text-lg font-semibold text-text">
              {title}
            </h2>
            {description ? (
              <p className="text-sm text-text-muted">{description}</p>
            ) : null}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label="Fermer"
            onClick={onClose}
            icon={<X className="size-4" aria-hidden="true" />}
          >
            <span className="sr-only">Fermer</span>
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</div>
        {footer ? (
          <div className="border-t border-border p-4 sm:p-6">{footer}</div>
        ) : null}
      </aside>
    </div>
    </ModalPortal>
  );
}
