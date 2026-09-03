"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { ModalPortal } from "@/components/ui/modal-portal";
import { formatGuestFullName } from "@/lib/guests";
import { archiveGuestAction } from "@/server/guests/actions";
import type { GuestRecord } from "@/types/guests";

export function ArchiveGuestDialog({ guest, onClose, onSuccess }: { guest: GuestRecord; onClose: () => void; onSuccess: (guest: GuestRecord) => void }) {
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const name = formatGuestFullName(guest.lastName, guest.firstNames);
  const handleArchive = () => startTransition(async () => {
    const result = await archiveGuestAction(guest.id);
    if (result.error || !result.guest) { setError(result.error ?? "Archivage impossible."); return; }
    onSuccess(result.guest);
  });

  return <ModalPortal><div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center"><button type="button" className="animate-overlay-in absolute inset-0 bg-text/35 backdrop-blur-[2px]" aria-label="Fermer" onClick={onClose} /><section role="dialog" aria-modal="true" aria-labelledby="archive-guest-title" className="animate-dialog-in relative z-10 w-full max-w-md rounded-t-md border border-border bg-surface p-5 shadow-overlay sm:rounded-md sm:p-6"><h2 id="archive-guest-title" className="text-lg font-semibold text-text">Archiver « {name} » ?</h2><p className="mt-2 text-sm leading-6 text-text-muted">L’invité ne sera plus affiché dans les listes par défaut, mais toutes ses données et son historique seront conservés.</p>{error ? <div className="mt-4"><ErrorState title="Archivage impossible" message={error} /></div> : null}<div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button variant="secondary" onClick={onClose} disabled={isPending}>Annuler</Button><Button onClick={handleArchive} loading={isPending} disabled={isPending}>Archiver l’invité</Button></div></section></div></ModalPortal>;
}
