"use client";

import { useEffect, useId, useTransition } from "react";
import { Download, RefreshCw, X } from "lucide-react";

import { TicketStatusBadge, TicketTypeBadge } from "@/components/admin/tickets/ticket-status-badge";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { ModalPortal } from "@/components/ui/modal-portal";
import { useToast } from "@/components/ui/toast";
import { formatTicketGuests } from "@/lib/tickets";
import { cn } from "@/lib/utils";
import {
  getTicketDownloadAction,
  regenerateTicketPdfAction,
} from "@/server/tickets/actions";
import type { TicketRecord } from "@/types/tickets";
import { TicketStatus } from "@prisma/client";
import { useState } from "react";

export interface TicketDetailDialogProps {
  ticket: TicketRecord | null;
  open: boolean;
  onClose: () => void;
  onTicketUpdated: (ticket: TicketRecord) => void;
  onCancelRequest: (ticket: TicketRecord) => void;
}

export function TicketDetailDialog({
  ticket,
  open,
  onClose,
  onTicketUpdated,
  onCancelRequest,
}: TicketDetailDialogProps) {
  const titleId = useId();
  const { toast } = useToast();
  const [error, setError] = useState<string>();
  const [downloadBusy, startDownload] = useTransition();
  const [regenBusy, startRegen] = useTransition();

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

  if (!open || !ticket) return null;

  const canCancel =
    ticket.status === TicketStatus.ACTIVE || ticket.status === TicketStatus.USED;

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
          aria-labelledby={titleId}
          className={cn(
            "animate-dialog-in relative z-10 w-full max-w-lg rounded-t-md border border-border bg-surface p-5 shadow-overlay",
            "sm:rounded-md sm:p-6",
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
            <div>
              <h2 id={titleId} className="text-lg font-semibold text-text">
                Billet {ticket.shortCode}
              </h2>
              <p className="mt-1 text-sm text-text-muted">
                Émis le {new Date(ticket.issuedAt).toLocaleString("fr-FR")}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              aria-label="Fermer"
              onClick={onClose}
              icon={<X className="size-4" aria-hidden="true" />}
            >
              <span className="sr-only">Fermer</span>
            </Button>
          </div>

          <dl className="mt-5 space-y-4 text-sm">
            <div className="flex flex-wrap gap-2">
              <TicketTypeBadge type={ticket.type} />
              <TicketStatusBadge status={ticket.status} />
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                Invités
              </dt>
              <dd className="mt-1 font-medium text-text">
                {formatTicketGuests(ticket.guests)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                Table
              </dt>
              <dd className="mt-1 text-text">{ticket.table.label}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-text-muted">PDF</dt>
              <dd className="mt-1 text-text">
                {ticket.pdfAvailable
                  ? `Généré le ${new Date(ticket.pdfGeneratedAt!).toLocaleString("fr-FR")}`
                  : ticket.pdfError ?? "Non disponible"}
              </dd>
            </div>
          </dl>

          {error ? (
            <div className="mt-4">
              <ErrorState title="Action impossible" message={error} />
            </div>
          ) : null}

          <div className="mt-6 border-t border-border pt-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {ticket.pdfAvailable ? (
              <Button
                className="sm:col-span-2"
                loading={downloadBusy}
                onClick={() =>
                  startDownload(async () => {
                    setError(undefined);
                    const result = await getTicketDownloadAction(ticket.id);
                    if (result.error || !result.url) {
                      setError(result.error ?? "Téléchargement impossible.");
                      return;
                    }
                    window.open(result.url, "_blank", "noopener");
                  })
                }
              >
                <Download className="size-4" aria-hidden="true" /> Télécharger
              </Button>
            ) : null}
            {ticket.status === TicketStatus.ACTIVE || ticket.status === TicketStatus.USED ? (
              <Button
                variant="secondary"
                className="w-full"
                loading={regenBusy}
                onClick={() =>
                  startRegen(async () => {
                    setError(undefined);
                    const result = await regenerateTicketPdfAction(ticket.id);
                    if (result.error || !result.ticket) {
                      setError(result.error ?? "Régénération impossible.");
                      return;
                    }
                    onTicketUpdated(result.ticket);
                    toast({
                      title: "PDF régénéré",
                      description: `Le PDF du billet ${result.ticket.shortCode} est prêt.`,
                      variant: "success",
                    });
                  })
                }
              >
                <RefreshCw className="size-4" aria-hidden="true" /> Régénérer le PDF
              </Button>
            ) : null}
            {canCancel ? (
              <Button
                variant="danger"
                className="w-full"
                onClick={() => {
                  onClose();
                  onCancelRequest(ticket);
                }}
              >
                Annuler le billet
              </Button>
            ) : null}
            </div>
          </div>
        </section>
      </div>
    </ModalPortal>
  );
}
