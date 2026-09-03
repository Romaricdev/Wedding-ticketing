"use client";

import { useId, useState } from "react";
import { X } from "lucide-react";

import { TableForm } from "@/components/admin/tables/table-form";
import { Button } from "@/components/ui/button";
import { ModalPortal } from "@/components/ui/modal-portal";
import { SuccessState } from "@/components/ui/success-state";
import { cn } from "@/lib/utils";
import type { TableWithStats } from "@/types/tables";

interface TableDialogProps {
  open: boolean;
  mode: "create" | "edit";
  table?: { id: string; label: string; capacity: number };
  onClose: () => void;
  onSuccess: (table: TableWithStats, mode: "create" | "edit") => void;
}

export function TableDialog({ open, mode, table, onClose, onSuccess }: TableDialogProps) {
  const titleId = useId();
  const [phase, setPhase] = useState<"form" | "success">("form");
  const [savedTable, setSavedTable] = useState<TableWithStats | null>(null);

  if (!open) return null;

  const handleClose = () => {
    setPhase("form");
    setSavedTable(null);
    onClose();
  };

  const title = mode === "create" ? "Ajouter une table" : "Modifier la table";
  const description =
    phase === "success"
      ? undefined
      : mode === "create"
        ? "Définissez son libellé et sa capacité maximale."
        : "La capacité ne peut pas être inférieure aux places déjà attribuées.";

  const handleFormSuccess = (nextTable: TableWithStats) => {
    setSavedTable(nextTable);
    setPhase("success");
    onSuccess(nextTable, mode);
  };

  const handleAddAnother = () => {
    setPhase("form");
    setSavedTable(null);
  };

  const successTitle = mode === "create" ? "Table créée" : "Modifications enregistrées";
  const successDescription =
    mode === "create"
      ? "La table est prête pour les attributions d'invités."
      : "Les informations de la table ont été mises à jour.";

  return (
    <ModalPortal>
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
      <button type="button" className="animate-overlay-in absolute inset-0 bg-text/35 backdrop-blur-[2px]" aria-label="Fermer" onClick={handleClose} />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "animate-dialog-in relative z-10 w-full max-w-lg rounded-t-md border border-border bg-surface p-5 shadow-overlay",
          "sm:rounded-md sm:p-6",
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
          <div>
            <h2 id={titleId} className="text-lg font-semibold text-text">
              {phase === "success" ? successTitle : title}
            </h2>
            {description ? (
              <p className="mt-1 text-sm text-text-muted">{description}</p>
            ) : null}
          </div>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Fermer"
            onClick={handleClose}
            icon={<X className="size-4" aria-hidden="true" />}
          >
            <span className="sr-only">Fermer</span>
          </Button>
        </div>

        <div className="pt-5">
          {phase === "success" && savedTable ? (
            <SuccessState
              description={successDescription}
              details={[
                { label: "Table", value: savedTable.label },
                {
                  label: "Capacité",
                  value: `${savedTable.capacity} place${savedTable.capacity > 1 ? "s" : ""}`,
                },
                {
                  label: "Occupation",
                  value: `${savedTable.assignedCount} / ${savedTable.capacity}`,
                },
              ]}
              actions={
                <>
                  {mode === "create" ? (
                    <Button variant="secondary" onClick={handleAddAnother}>
                      Ajouter une autre table
                    </Button>
                  ) : null}
                  <Button onClick={handleClose}>Fermer</Button>
                </>
              }
            />
          ) : (
            <TableForm
              mode={mode}
              tableId={table?.id}
              defaultValues={
                table ? { label: table.label, capacity: String(table.capacity) } : undefined
              }
              onCancel={handleClose}
              onSuccess={handleFormSuccess}
            />
          )}
        </div>
      </section>
    </div>
    </ModalPortal>
  );
}
