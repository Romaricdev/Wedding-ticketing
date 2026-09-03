"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { ModalPortal } from "@/components/ui/modal-portal";
import { bulkDeleteTablesAction } from "@/server/tables/actions";
import type { TableWithStats } from "@/types/tables";

export function BulkDeleteTablesDialog({ tables, onClose, onSuccess }: { tables: TableWithStats[]; onClose: () => void; onSuccess: (ids: string[]) => void }) {
  const [error, setError] = useState<string>(); const [pending, startTransition] = useTransition();
  const submit = () => startTransition(async () => { const result = await bulkDeleteTablesAction(tables.map((table) => table.id)); if (result.error || !result.tableIds) { setError(result.error ?? "Suppression impossible."); return; } onSuccess(result.tableIds); });
  return <ModalPortal><div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center"><button type="button" className="animate-overlay-in absolute inset-0 bg-text/35 backdrop-blur-[2px]" aria-label="Fermer" onClick={onClose} /><section role="dialog" aria-modal="true" className="animate-dialog-in relative z-10 w-full max-w-md rounded-t-md border border-border bg-surface p-5 shadow-overlay sm:rounded-md sm:p-6"><h2 className="text-lg font-semibold text-text">Supprimer {tables.length} table{tables.length > 1 ? "s" : ""} ?</h2><p className="mt-2 text-sm leading-6 text-text-muted">La suppression est définitive pour les tables vides. L’action sera refusée si une table contient des invités actifs.</p>{error ? <div className="mt-4"><ErrorState title="Suppression impossible" message={error} /></div> : null}<div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button variant="secondary" onClick={onClose} disabled={pending}>Annuler</Button><Button variant="danger" onClick={submit} loading={pending} disabled={pending}>Supprimer la sélection</Button></div></section></div></ModalPortal>;
}
