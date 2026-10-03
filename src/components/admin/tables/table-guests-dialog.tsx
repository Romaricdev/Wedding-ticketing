"use client";

import { useEffect, useId, useState, useTransition } from "react";
import { X } from "lucide-react";

import { TableAssignedGuests } from "@/components/admin/tables/table-assigned-guests";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { ModalPortal } from "@/components/ui/modal-portal";
import { loadTableGuestsAction } from "@/server/tables/actions";
import type { GuestRecord } from "@/types/guests";
import type { TableWithStats } from "@/types/tables";

interface TableGuestsDialogProps {
  table: TableWithStats;
  open: boolean;
  onClose: () => void;
}

function TableGuestsDialogBody({ table }: { table: TableWithStats }) {
  const [guests, setGuests] = useState<GuestRecord[]>([]);
  const [error, setError] = useState<string>();
  const [isLoading, startLoad] = useTransition();

  useEffect(() => {
    startLoad(async () => {
      const result = await loadTableGuestsAction(table.id);
      if (result.error) {
        setError(result.error);
        setGuests([]);
        return;
      }
      setError(undefined);
      setGuests(result.guests ?? []);
    });
  }, [table.id]);

  if (isLoading) {
    return <LoadingState label="Chargement des invités…" />;
  }

  if (error) {
    return <ErrorState title="Chargement impossible" message={error} />;
  }

  return <TableAssignedGuests guests={guests} tableLabel={table.label} />;
}

export function TableGuestsDialog({ table, open, onClose }: TableGuestsDialogProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
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
          aria-label="Fermer"
          onClick={onClose}
        />
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="animate-dialog-in relative z-10 flex max-h-[92vh] w-full max-w-lg flex-col rounded-t-md border border-border bg-surface shadow-overlay sm:rounded-md"
        >
          <div className="flex items-start justify-between gap-4 border-b border-border p-5 sm:p-6">
            <div>
              <h2 id={titleId} className="text-lg font-semibold text-text">
                Invités — {table.label}
              </h2>
              <p className="mt-1 text-sm text-text-muted">
                {table.assignedCount} / {table.capacity} places attribuées · {table.availableCount}{" "}
                libre{table.availableCount > 1 ? "s" : ""}
              </p>
            </div>
            <Button variant="ghost" size="sm" aria-label="Fermer" onClick={onClose}>
              <X className="size-4" aria-hidden="true" />
            </Button>
          </div>
          <div className="overflow-y-auto p-5 sm:p-6">
            <TableGuestsDialogBody key={table.id} table={table} />
          </div>
        </section>
      </div>
    </ModalPortal>
  );
}
