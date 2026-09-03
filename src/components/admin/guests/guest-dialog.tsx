"use client";

import { useId, useState } from "react";
import { X } from "lucide-react";

import { GuestForm } from "@/components/admin/guests/guest-form";
import { Button } from "@/components/ui/button";
import { ModalPortal } from "@/components/ui/modal-portal";
import { SuccessState } from "@/components/ui/success-state";
import { formatGuestFullName } from "@/lib/guests";
import { cn } from "@/lib/utils";
import type { GuestRecord } from "@/types/guests";

interface GuestDialogProps {
  open: boolean;
  mode: "create" | "edit";
  guest?: GuestRecord;
  onClose: () => void;
  onSuccess: (guest: GuestRecord, mode: "create" | "edit") => void;
}

export function GuestDialog({ open, mode, guest, onClose, onSuccess }: GuestDialogProps) {
  const titleId = useId();
  const [phase, setPhase] = useState<"form" | "success">("form");
  const [savedGuest, setSavedGuest] = useState<GuestRecord | null>(null);

  if (!open) return null;

  const handleClose = () => {
    setPhase("form");
    setSavedGuest(null);
    onClose();
  };

  const title = mode === "create" ? "Ajouter un invité" : "Modifier l'invité";
  const description =
    phase === "success"
      ? undefined
      : "Renseignez le nom et les prénoms. L'affectation à une table se fera lors de la création du billet.";

  const handleFormSuccess = (nextGuest: GuestRecord) => {
    setSavedGuest(nextGuest);
    setPhase("success");
    onSuccess(nextGuest, mode);
  };

  const handleAddAnother = () => {
    setPhase("form");
    setSavedGuest(null);
  };

  const successTitle = mode === "create" ? "Invité créé" : "Modifications enregistrées";
  const successDescription =
    mode === "create"
      ? "La personne est enregistrée et pourra être liée à un billet en Phase 5."
      : "Les informations de l'invité ont été mises à jour.";

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
          {phase === "success" && savedGuest ? (
            <SuccessState
              description={successDescription}
              details={[
                {
                  label: "Invité",
                  value: formatGuestFullName(savedGuest.lastName, savedGuest.firstNames),
                },
                {
                  label: "Notes",
                  value: savedGuest.notes?.trim() ? savedGuest.notes : "—",
                },
              ]}
              actions={
                <>
                  {mode === "create" ? (
                    <Button variant="secondary" onClick={handleAddAnother}>
                      Ajouter un autre invité
                    </Button>
                  ) : null}
                  <Button onClick={handleClose}>Fermer</Button>
                </>
              }
            />
          ) : (
            <GuestForm
              key={mode === "edit" ? guest?.id ?? "edit" : "create"}
              mode={mode}
              guestId={guest?.id}
              defaultValues={
                guest
                  ? {
                      lastName: guest.lastName,
                      firstNames: guest.firstNames,
                      notes: guest.notes ?? "",
                    }
                  : undefined
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
