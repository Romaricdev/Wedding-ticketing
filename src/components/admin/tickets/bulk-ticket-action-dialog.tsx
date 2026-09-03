"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { ModalPortal } from "@/components/ui/modal-portal";
import { bulkCancelTicketsAction, bulkRegenerateTicketPdfsAction } from "@/server/tickets/actions";
import type { TicketRecord } from "@/types/tickets";

export function BulkTicketActionDialog({
  action,
  tickets,
  onClose,
  onSuccess,
}: {
  action: "cancel" | "regenerate";
  tickets: TicketRecord[];
  onClose: () => void;
  onSuccess: (tickets: TicketRecord[]) => void;
}) {
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const isCancel = action === "cancel";
  const label = isCancel ? "Annuler" : "Régénérer les PDF de";

  const submit = () => startTransition(async () => {
    const result = isCancel
      ? await bulkCancelTicketsAction(tickets.map((ticket) => ticket.id))
      : await bulkRegenerateTicketPdfsAction(tickets.map((ticket) => ticket.id));
    if (result.error || !result.tickets) {
      setError(result.error ?? "Action impossible.");
      return;
    }
    onSuccess(result.tickets);
  });

  return <ModalPortal><div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center"><button type="button" className="animate-overlay-in absolute inset-0 bg-text/35 backdrop-blur-[2px]" aria-label="Fermer" onClick={onClose} /><section role="dialog" aria-modal="true" className="animate-dialog-in relative z-10 w-full max-w-md rounded-t-md border border-border bg-surface p-5 shadow-overlay sm:rounded-md sm:p-6"><h2 className="text-lg font-semibold text-text">{label} {tickets.length} billet{tickets.length > 1 ? "s" : ""} ?</h2><p className="mt-2 text-sm leading-6 text-text-muted">{isCancel ? "Les billets sélectionnés deviendront invalides et les places concernées seront libérées." : "Les PDF seront générés à nouveau avec le même billet, le même QR et le même modèle historique."}</p>{error ? <div className="mt-4"><ErrorState title="Action impossible" message={error} /></div> : null}<div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button variant="secondary" onClick={onClose} disabled={pending}>Retour</Button><Button variant={isCancel ? "danger" : "primary"} onClick={submit} loading={pending} disabled={pending}>{isCancel ? "Annuler la sélection" : "Régénérer les PDF"}</Button></div></section></div></ModalPortal>;
}
