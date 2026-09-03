"use client";

import { useActionState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { ModalPortal } from "@/components/ui/modal-portal";
import { FormField } from "@/components/ui/form-field";
import { Textarea } from "@/components/ui/textarea";
import { formatGuestFullName } from "@/lib/guests";
import { cn } from "@/lib/utils";
import { cancelGuestAction, type GuestCancelState } from "@/server/guests/actions";
import type { GuestRecord } from "@/types/guests";

export interface CancelGuestDialogProps {
  guest: GuestRecord;
  open: boolean;
  onClose: () => void;
  onSuccess: (guest: GuestRecord) => void;
}

export function CancelGuestDialog({
  guest,
  open,
  onClose,
  onSuccess,
}: CancelGuestDialogProps) {
  const [state, formAction, isPending] = useActionState(
    cancelGuestAction.bind(null, guest.id),
    {} as GuestCancelState,
  );

  useEffect(() => {
    if (state.success && state.guest) {
      onSuccess(state.guest);
    }
  }, [onSuccess, state.guest, state.success]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const fullName = formatGuestFullName(guest.lastName, guest.firstNames);

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
        aria-labelledby="cancel-guest-title"
        aria-describedby="cancel-guest-description"
        className={cn(
          "animate-dialog-in relative z-10 w-full max-w-md rounded-t-md border border-border bg-surface p-6 shadow-overlay",
          "sm:rounded-md",
        )}
      >
        <h2 id="cancel-guest-title" className="text-lg font-semibold text-text">
          Annuler l&apos;invité « {fullName} » ?
        </h2>
        <p id="cancel-guest-description" className="mt-2 text-sm text-text-muted">
          L&apos;invité restera consultable dans l&apos;historique, mais ne pourra plus être
          utilisé pour créer un billet. Aucune donnée n&apos;est supprimée.
        </p>

        {state.error ? (
          <div className="mt-4">
            <ErrorState title="Annulation impossible" message={state.error} />
          </div>
        ) : null}

        <form action={formAction} className="mt-5 space-y-5">
          <FormField
            label="Motif (facultatif)"
            htmlFor="reason"
            error={state.fieldErrors?.reason}
          >
            <Textarea
              id="reason"
              name="reason"
              rows={3}
              disabled={isPending}
              hasError={Boolean(state.fieldErrors?.reason)}
              placeholder="Ex. désistement confirmé"
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
      </div>
    </div>
    </ModalPortal>
  );
}
