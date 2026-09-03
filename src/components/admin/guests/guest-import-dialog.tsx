"use client";

import { useActionState, useId, useState, useTransition } from "react";
import { Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loading-state";
import { ModalPortal } from "@/components/ui/modal-portal";
import { SuccessState } from "@/components/ui/success-state";
import { cn } from "@/lib/utils";
import {
  confirmGuestImportAction,
  previewGuestImportAction,
  type GuestImportPreviewState,
} from "@/server/guests/actions";
import type { GuestRecord } from "@/types/guests";

export interface GuestImportDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (guests: GuestRecord[]) => void;
}

export function GuestImportDialog({ open, onClose, onSuccess }: GuestImportDialogProps) {
  const titleId = useId();
  const [preview, previewAction, isPreviewPending] = useActionState(
    previewGuestImportAction,
    {} as GuestImportPreviewState,
  );
  const [confirmError, setConfirmError] = useState<string | undefined>();
  const [isConfirming, startConfirm] = useTransition();
  const [showUploadAgain, setShowUploadAgain] = useState(false);
  const [importedCount, setImportedCount] = useState<number | null>(null);

  if (!open) return null;

  const handleClose = () => {
    setShowUploadAgain(false);
    setConfirmError(undefined);
    setImportedCount(null);
    onClose();
  };

  const phase =
    importedCount !== null
      ? "success"
      : !showUploadAgain && preview.success && preview.validRows
        ? "preview"
        : "upload";

  const canConfirm =
    Boolean(preview.success) &&
    (preview.summary?.invalid ?? 0) === 0 &&
    (preview.validRows?.length ?? 0) > 0;

  const handleConfirm = () => {
    if (!preview.validRows?.length) return;

    startConfirm(async () => {
      setConfirmError(undefined);
      const result = await confirmGuestImportAction(JSON.stringify(preview.validRows));

      if (result.error || !result.success || !result.guests) {
        setConfirmError(result.error ?? "L'import a échoué.");
        return;
      }

      setImportedCount(result.importedCount ?? result.guests.length);
      onSuccess(result.guests);
    });
  };

  return (
    <ModalPortal>
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="animate-overlay-in absolute inset-0 bg-text/35 backdrop-blur-[2px]"
        aria-label="Fermer"
        onClick={handleClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "animate-dialog-in relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col rounded-t-md border border-border bg-surface shadow-overlay",
          "sm:rounded-md",
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border p-5 sm:p-6">
          <div>
            <h2 id={titleId} className="text-lg font-semibold text-text">
              {phase === "success" ? "Import terminé" : "Importer un CSV"}
            </h2>
            {phase !== "success" ? (
              <p className="mt-1 text-sm text-text-muted">
                Format attendu : <code className="text-xs">nom,prenoms,notes</code>. Aucune
                table ni billet n&apos;est importé.
              </p>
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

        <div className="overflow-y-auto p-5 sm:p-6">
          {phase === "success" ? (
            <SuccessState
              description={`${importedCount} invité${(importedCount ?? 0) > 1 ? "s" : ""} importé${(importedCount ?? 0) > 1 ? "s" : ""} avec succès.`}
              actions={<Button onClick={handleClose}>Fermer</Button>}
            />
          ) : null}

          {phase === "upload" ? (
            <form
              action={(formData) => {
                setShowUploadAgain(false);
                setConfirmError(undefined);
                previewAction(formData);
              }}
              className="space-y-5"
            >
              <FormField
                label="Fichier CSV"
                htmlFor="guest-csv-file"
                help="En-têtes acceptés : nom/prenoms/notes ou lastName/firstNames/notes."
              >
                <Input
                  id="guest-csv-file"
                  name="file"
                  type="file"
                  accept=".csv,text/csv"
                  required
                  disabled={isPreviewPending}
                />
              </FormField>

              {preview.error ? (
                <ErrorState title="Import impossible" message={preview.error} />
              ) : null}

              {isPreviewPending ? (
                <LoadingState label="Analyse du fichier…" className="py-6" />
              ) : (
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button type="submit" disabled={isPreviewPending}>
                    <Upload className="size-4" aria-hidden="true" /> Analyser le fichier
                  </Button>
                  <Button type="button" variant="secondary" onClick={handleClose}>
                    Annuler
                  </Button>
                </div>
              )}
            </form>
          ) : null}

          {phase === "preview" && preview.summary ? (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <SummaryTile label="Lignes lues" value={preview.summary.total} />
                <SummaryTile label="Valides" value={preview.summary.valid} />
                <SummaryTile label="Erreurs" value={preview.summary.invalid} />
                <SummaryTile label="Avertissements" value={preview.summary.warnings} />
              </div>

              {preview.invalidRows && preview.invalidRows.length > 0 ? (
                <ErrorState
                  title="Erreurs bloquantes"
                  message="Corrigez le fichier puis relancez l'analyse. Aucune donnée ne sera écrite tant qu'il reste des erreurs."
                />
              ) : null}

              {preview.invalidRows && preview.invalidRows.length > 0 ? (
                <IssueList
                  title="Lignes invalides"
                  items={preview.invalidRows.map(
                    (row) => `Ligne ${row.lineNumber} — ${row.message}`,
                  )}
                />
              ) : null}

              {preview.warnings && preview.warnings.length > 0 ? (
                <IssueList
                  title="Avertissements (non bloquants)"
                  items={preview.warnings.map(
                    (row) => `Ligne ${row.lineNumber} — ${row.message}`,
                  )}
                />
              ) : null}

              {preview.validRows && preview.validRows.length > 0 ? (
                <div className="overflow-x-auto rounded-md border border-border">
                  <table className="min-w-full text-sm">
                    <thead className="border-b border-border bg-surface-subtle">
                      <tr>
                        {["Ligne", "Nom", "Prénoms", "Notes"].map((header) => (
                          <th
                            key={header}
                            className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-text-muted"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {preview.validRows.slice(0, 8).map((row) => (
                        <tr key={row.lineNumber}>
                          <td className="px-3 py-2 tabular-nums text-text-muted">
                            {row.lineNumber}
                          </td>
                          <td className="px-3 py-2 font-medium text-text">{row.lastName}</td>
                          <td className="px-3 py-2 text-text">{row.firstNames}</td>
                          <td className="px-3 py-2 text-text-muted">
                            {row.notes?.trim() ? row.notes : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {preview.validRows.length > 8 ? (
                    <p className="border-t border-border px-3 py-2 text-xs text-text-muted">
                      Aperçu limité aux 8 premières lignes valides.
                    </p>
                  ) : null}
                </div>
              ) : null}

              {confirmError ? (
                <ErrorState title="Import refusé" message={confirmError} />
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowUploadAgain(true);
                    setConfirmError(undefined);
                  }}
                  disabled={isConfirming}
                >
                  Choisir un autre fichier
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirm}
                  disabled={!canConfirm || isConfirming}
                  loading={isConfirming}
                >
                  Confirmer l&apos;import ({preview.summary.valid})
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </div>
    </ModalPortal>
  );
}

function SummaryTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border bg-surface-subtle p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-text">{value}</p>
    </div>
  );
}

function IssueList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-md border border-border p-3">
      <p className="text-sm font-semibold text-text">{title}</p>
      <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-sm text-text-muted">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
