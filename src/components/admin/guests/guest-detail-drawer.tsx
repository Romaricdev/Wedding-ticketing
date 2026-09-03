"use client";

import { Pencil, X } from "lucide-react";
import { useEffect, useId } from "react";

import { GuestStatusBadge } from "@/components/admin/guests/guest-status-badge";
import { Button } from "@/components/ui/button";
import { ModalPortal } from "@/components/ui/modal-portal";
import { formatGuestFullName } from "@/lib/guests";
import type { GuestRecord } from "@/types/guests";
import { GuestStatus } from "@prisma/client";
import { cn } from "@/lib/utils";

export interface GuestDetailDrawerProps {
  guest: GuestRecord | null;
  open: boolean;
  onClose: () => void;
  onEdit: (guest: GuestRecord) => void;
}

/** The name is preserved for compatibility; the UI is intentionally a centered modal. */
export function GuestDetailDrawer({ guest, open, onClose, onEdit }: GuestDetailDrawerProps) {
  const titleId = useId();
  const isLeaving = !open;

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  if (!guest) return null;

  const fullName = formatGuestFullName(guest.lastName, guest.firstNames);
  const canEdit = guest.status === GuestStatus.ACTIVE;
  const formatDate = (date: Date | string) => new Date(date).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });

  return <ModalPortal>
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <button type="button" className={cn("absolute inset-0 bg-text/35 backdrop-blur-[2px]", isLeaving ? "animate-overlay-out" : "animate-overlay-in")} aria-label="Fermer la fiche invité" onClick={onClose} />
      <section role="dialog" aria-modal="true" aria-labelledby={titleId} className={cn("relative z-10 flex max-h-[90dvh] w-full max-w-xl flex-col rounded-t-md border border-border bg-surface shadow-overlay sm:rounded-md", isLeaving ? "animate-dialog-out" : "animate-dialog-in")}>
        <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Fiche invité</p>
            <h2 id={titleId} className="mt-1 truncate text-xl font-semibold text-text">{fullName}</h2>
          </div>
          <Button variant="ghost" size="sm" aria-label="Fermer" onClick={onClose} icon={<X className="size-4" aria-hidden="true" />}><span className="sr-only">Fermer</span></Button>
        </header>

        <div className="overflow-y-auto px-5 py-5 sm:px-6">
          <div className="flex items-center justify-between gap-4 border-b border-border pb-5"><div><p className="text-sm font-medium text-text">État de l’invitation</p><p className="mt-1 text-sm text-text-muted">Les détails administratifs de cet invité.</p></div><GuestStatusBadge status={guest.status} /></div>
          <dl className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DetailItem label="Nom" value={guest.lastName} />
            <DetailItem label="Prénoms" value={guest.firstNames} />
            <DetailItem label="Créé le" value={formatDate(guest.createdAt)} muted />
            <DetailItem label="Mis à jour le" value={formatDate(guest.updatedAt)} muted />
            <div className="border border-border bg-surface-subtle p-4 sm:col-span-2"><dt className="text-xs font-semibold uppercase tracking-wide text-text-muted">Notes</dt><dd className="mt-2 whitespace-pre-wrap text-sm leading-6 text-text">{guest.notes?.trim() || "Aucune note"}</dd></div>
          </dl>
        </div>

        <footer className="flex flex-col-reverse gap-3 border-t border-border px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <Button variant="secondary" onClick={onClose}>Fermer</Button>
          {canEdit ? <Button variant="primary" onClick={() => { onClose(); onEdit(guest); }}><Pencil className="size-4" aria-hidden="true" /> Modifier</Button> : null}
        </footer>
      </section>
    </div>
  </ModalPortal>;
}

function DetailItem({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return <div className="border border-border bg-surface p-4"><dt className="text-xs font-semibold uppercase tracking-wide text-text-muted">{label}</dt><dd className={cn("mt-2 text-sm font-medium", muted ? "text-text-muted" : "text-text")}>{value}</dd></div>;
}
