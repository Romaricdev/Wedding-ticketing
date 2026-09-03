"use client";

import { useActionState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { FormField } from "@/components/ui/form-field";
import { ModalPortal } from "@/components/ui/modal-portal";
import { Textarea } from "@/components/ui/textarea";
import { formatTicketGuests } from "@/lib/tickets";
import { cn } from "@/lib/utils";
import { cancelTicketAction, type TicketCancelState } from "@/server/tickets/actions";
import type { TicketRecord } from "@/types/tickets";

export interface CancelTicketDialogProps {
  ticket: TicketRecord;
  open: boolean;
  onClose: () => void;
  onSuccess: (ticket: TicketRecord) => void;
}

export function CancelTicketDialog({
  ticket,
  open,
  onClose,
  onSuccess,
}: CancelTicketDialogProps) {
  const [state, formAction, isPending] = useActionState(
    cancelTicketAction.bind(null, ticket.id),
    {} as TicketCancelState,
  );

  useEffect(() => {
    if (state.success && state.ticket) onSuccess(state.ticket);
  }, [onSuccess, state.success, state.ticket]);

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
          aria-labelledby="cancel-ticket-title"
          className={cn(
            "animate-dialog-in relative z-10 w-full max-w-md rounded-t-md border border-border bg-surface p-6 shadow-overlay",
            "sm:rounded-md",
          )}
        >
          <h2 id="cancel-ticket-title" className="text-lg font-semibold text-text">
            Annuler le billet {ticket.shortCode} ?
          </h2>
          <p className="mt-2 text-sm text-text-muted">
            Le QR ne sera plus accepté. Les places de la table « {ticket.table.label} » seront
            libérées pour {formatTicketGuests(ticket.guests)}. Aucune donnée n&apos;est
            supprimée.
          </p>

          {state.error ? (
            <div className="mt-4">
              <ErrorState title="Annulation impossible" message={state.error} />
            </div>
          ) : null}

          <form action={formAction} className="mt-5 space-y-5">
            <FormField label="Motif (facultatif)" htmlFor="reason" error={state.fieldErrors?.reason}>
              <Textarea
                id="reason"
                name="reason"
                rows={3}
                disabled={isPending}
                placeholder="Ex. billet perdu, correction de composition"
              />
            </FormField>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>
                Retour
              </Button>
              <Button type="submit" variant="danger" loading={isPending} disabled={isPending}>
                Confirmer l&apos;annulation
              </Button>
            </div>
          </form>
        </section>
      </div>
    </ModalPortal>
  );
}
