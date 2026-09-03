"use client";

import { useActionState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { ModalPortal } from "@/components/ui/modal-portal";
import { deleteTableAction } from "@/server/tables/actions";
import type { TableWithStats } from "@/types/tables";
import { cn } from "@/lib/utils";

export interface DeleteTableDialogProps {
  table: TableWithStats;
  open: boolean;
  onClose: () => void;
}

export function DeleteTableDialog({ table, open, onClose }: DeleteTableDialogProps) {
  const [state, formAction, isPending] = useActionState(
    deleteTableAction.bind(null, table.id),
    {},
  );

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
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="animate-overlay-in absolute inset-0 bg-text/35 backdrop-blur-[2px]"
        aria-label="Fermer la confirmation"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-table-title"
        aria-describedby="delete-table-description"
        className={cn(
          "animate-dialog-in relative z-10 w-full max-w-md rounded-t-md border border-border bg-surface p-6 shadow-overlay",
          "sm:rounded-md",
        )}
      >
        <h2 id="delete-table-title" className="text-lg font-semibold text-text">
          Supprimer la table « {table.label} » ?
        </h2>
        <p id="delete-table-description" className="mt-2 text-sm text-text-muted">
          Cette action est impossible si des invités actifs y sont associés.
        </p>

        {state.error ? (
          <div className="mt-4">
            <ErrorState title="Suppression impossible" message={state.error} />
          </div>
        ) : null}

        <form action={formAction} className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>
            Annuler
          </Button>
          <Button type="submit" variant="danger" loading={isPending} disabled={isPending}>
            Supprimer la table
          </Button>
        </form>
      </div>
    </div>
    </ModalPortal>
  );
}
