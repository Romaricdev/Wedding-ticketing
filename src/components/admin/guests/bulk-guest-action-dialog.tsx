"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { ModalPortal } from "@/components/ui/modal-portal";
import { bulkArchiveGuestsAction, bulkCancelGuestsAction } from "@/server/guests/actions";
import type { GuestRecord } from "@/types/guests";

export function BulkGuestActionDialog({ action, guests, onClose, onSuccess }: { action: "archive" | "cancel"; guests: GuestRecord[]; onClose: () => void; onSuccess: (guests: GuestRecord[]) => void }) {
  const [error, setError] = useState<string>(); const [pending, startTransition] = useTransition();
  const isArchive = action === "archive"; const label = isArchive ? "Archiver" : "Annuler";
  const submit = () => startTransition(async () => { const result = isArchive ? await bulkArchiveGuestsAction(guests.map((guest) => guest.id)) : await bulkCancelGuestsAction(guests.map((guest) => guest.id)); if (result.error || !result.guests) { setError(result.error ?? "Action impossible."); return; } onSuccess(result.guests); });
  return <ModalPortal><div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center"><button type="button" className="animate-overlay-in absolute inset-0 bg-text/35 backdrop-blur-[2px]" aria-label="Fermer" onClick={onClose} /><section role="dialog" aria-modal="true" className="animate-dialog-in relative z-10 w-full max-w-md rounded-t-md border border-border bg-surface p-5 shadow-overlay sm:rounded-md sm:p-6"><h2 className="text-lg font-semibold text-text">{label} {guests.length} invité{guests.length > 1 ? "s" : ""} ?</h2><p className="mt-2 text-sm leading-6 text-text-muted">{isArchive ? "Les invités sélectionnés quitteront les listes par défaut, tout en restant conservés dans l’historique." : "Les invités actifs sélectionnés ne pourront plus recevoir de billet."}</p>{error ? <div className="mt-4"><ErrorState title="Action impossible" message={error} /></div> : null}<div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button variant="secondary" onClick={onClose} disabled={pending}>Retour</Button><Button variant={isArchive ? "primary" : "danger"} onClick={submit} loading={pending} disabled={pending}>{label} la sélection</Button></div></section></div></ModalPortal>;
}
