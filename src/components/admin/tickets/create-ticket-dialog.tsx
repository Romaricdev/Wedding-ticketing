"use client";

import { useActionState, useEffect, useId, useMemo, useRef, useState, useTransition } from "react";
import { TicketType } from "@prisma/client";
import { Check, Users, X } from "lucide-react";

import { TicketStatusBadge, TicketTypeBadge } from "@/components/admin/tickets/ticket-status-badge";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { ModalPortal } from "@/components/ui/modal-portal";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { SuccessState } from "@/components/ui/success-state";
import { useToast } from "@/components/ui/toast";
import { formatGuestFullName } from "@/lib/guests";
import { formatTicketGuests, getTicketTypeLabel } from "@/lib/tickets";
import { cn } from "@/lib/utils";
import {
  createTicketAction,
  getTicketDownloadAction,
  loadTicketWizardDataAction,
  regenerateTicketPdfAction,
  type TicketFormState,
} from "@/server/tickets/actions";
import type {
  AvailableTableOption,
  EligibleGuestOption,
  TicketRecord,
} from "@/types/tickets";

type WizardStep = "type" | "guests" | "table" | "confirm" | "success";

interface CreateTicketDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (ticket: TicketRecord) => void;
}

export function CreateTicketDialog({ open, onClose, onSuccess }: CreateTicketDialogProps) {
  const titleId = useId();
  const { toast } = useToast();
  const [step, setStep] = useState<WizardStep>("type");
  const [ticketType, setTicketType] = useState<TicketType>(TicketType.SINGLE);
  const [guestId, setGuestId] = useState("");
  const [guestId1, setGuestId1] = useState("");
  const [guestId2, setGuestId2] = useState("");
  const [tableId, setTableId] = useState("");
  const [guestQuery, setGuestQuery] = useState("");
  const [guests, setGuests] = useState<EligibleGuestOption[]>([]);
  const [tables, setTables] = useState<AvailableTableOption[]>([]);
  const [hasActiveTemplate, setHasActiveTemplate] = useState(true);
  const [loadError, setLoadError] = useState<string>();
  const [isLoadingOptions, startLoad] = useTransition();
  const [savedTicket, setSavedTicket] = useState<TicketRecord | null>(null);
  const [downloadBusy, startDownload] = useTransition();
  const [regenBusy, startRegen] = useTransition();
  const successNotifiedRef = useRef<string | null>(null);

  const [state, formAction, isPending] = useActionState(
    createTicketAction,
    {} as TicketFormState,
  );

  const requiredSeats = ticketType === TicketType.COUPLE ? 2 : 1;
  const successTicket = savedTicket ?? (state.success ? (state.ticket ?? null) : null);
  const activeStep: WizardStep = successTicket ? "success" : step;

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

  useEffect(() => {
    if (!open) return;
    startLoad(async () => {
      const result = await loadTicketWizardDataAction(requiredSeats);
      setGuests(result.guests);
      setTables(result.tables);
      setHasActiveTemplate(result.hasActiveTemplate);
      setLoadError(result.error);
    });
  }, [open, requiredSeats]);

  useEffect(() => {
    if (!state.success || !state.ticket) return;
    if (successNotifiedRef.current === state.ticket.id) return;
    successNotifiedRef.current = state.ticket.id;
    onSuccess(state.ticket);
  }, [onSuccess, state.success, state.ticket]);

  const filteredGuests = useMemo(() => {
    const query = guestQuery.trim().toLocaleLowerCase("fr");
    if (!query) return guests;
    return guests.filter((guest) =>
      `${guest.lastName} ${guest.firstNames}`.toLocaleLowerCase("fr").includes(query),
    );
  }, [guestQuery, guests]);

  const selectedGuests = useMemo(() => {
    if (ticketType === TicketType.SINGLE) {
      return guests.filter((guest) => guest.id === guestId);
    }
    return guests.filter((guest) => guest.id === guestId1 || guest.id === guestId2);
  }, [guestId, guestId1, guestId2, guests, ticketType]);

  const selectedTable = tables.find((table) => table.id === tableId);

  const reset = () => {
    setStep("type");
    setTicketType(TicketType.SINGLE);
    setGuestId("");
    setGuestId1("");
    setGuestId2("");
    setTableId("");
    setGuestQuery("");
    setSavedTicket(null);
    setLoadError(undefined);
    successNotifiedRef.current = null;
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!open) return null;

  const title =
    activeStep === "success"
      ? "Billet créé"
      : activeStep === "type"
        ? "Créer un billet"
        : activeStep === "guests"
          ? "Sélectionner les invités"
          : activeStep === "table"
            ? "Choisir la table"
            : "Confirmer le billet";

  const canContinueGuests =
    ticketType === TicketType.SINGLE
      ? Boolean(guestId)
      : Boolean(guestId1 && guestId2 && guestId1 !== guestId2);

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
          className="animate-dialog-in relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col rounded-t-md border border-border bg-surface shadow-overlay sm:rounded-md"
        >
          <div className="flex items-start justify-between gap-4 border-b border-border p-5 sm:p-6">
            <div>
              <h2 id={titleId} className="text-lg font-semibold text-text">
                {title}
              </h2>
              {activeStep !== "success" ? (
                <p className="mt-1 text-sm text-text-muted">
                  Single = 1 personne · Couple = 2 personnes, 1 table, 1 QR.
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
            {loadError ? <ErrorState title="Chargement impossible" message={loadError} /> : null}
            {!hasActiveTemplate && activeStep !== "success" ? (
              <div className="mb-4">
                <ErrorState
                  title="Template PDF manquant"
                  message="Activez un template PDF avant de créer un billet (seed ou configuration Storage)."
                />
              </div>
            ) : null}

            {isLoadingOptions && activeStep !== "success" ? (
              <LoadingState label="Chargement des invités et tables…" />
            ) : null}

            {activeStep === "type" ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[TicketType.SINGLE, TicketType.COUPLE].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setTicketType(type);
                      setGuestId("");
                      setGuestId1("");
                      setGuestId2("");
                      setTableId("");
                    }}
                    className={cn(
                      "rounded-md border p-4 text-left transition-colors",
                      ticketType === type
                        ? "border-primary bg-primary-subtle"
                        : "border-border hover:bg-surface-subtle",
                    )}
                  >
                    <p className="font-semibold text-text">{getTicketTypeLabel(type)}</p>
                    <p className="mt-1 text-sm text-text-muted">
                      {type === TicketType.SINGLE
                        ? "1 invité, 1 place, 1 QR."
                        : "2 invités distincts, même table, 1 QR unique."}
                    </p>
                  </button>
                ))}
                <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
                  <Button variant="secondary" onClick={handleClose}>
                    Annuler
                  </Button>
                  <Button
                    onClick={() => setStep("guests")}
                    disabled={!hasActiveTemplate || isLoadingOptions}
                    loading={isLoadingOptions}
                  >
                    Continuer
                  </Button>
                </div>
              </div>
            ) : null}

            {activeStep === "guests" && !isLoadingOptions ? (
              <div className="space-y-4">
                <SearchInput
                  value={guestQuery}
                  onValueChange={setGuestQuery}
                  placeholder="Rechercher un invité éligible…"
                  label="Rechercher un invité"
                />
                <div className="max-h-64 space-y-2 overflow-y-auto">
                  {filteredGuests.length === 0 ? (
                    <p className="text-sm text-text-muted">
                      Aucun invité actif sans billet disponible.
                    </p>
                  ) : (
                    filteredGuests.map((guest) => {
                      const selected =
                        ticketType === TicketType.SINGLE
                          ? guestId === guest.id
                          : guestId1 === guest.id || guestId2 === guest.id;
                      return (
                        <button
                          key={guest.id}
                          type="button"
                          onClick={() => {
                            if (ticketType === TicketType.SINGLE) {
                              setGuestId(guest.id);
                              return;
                            }
                            if (guestId1 === guest.id) {
                              setGuestId1("");
                              return;
                            }
                            if (guestId2 === guest.id) {
                              setGuestId2("");
                              return;
                            }
                            if (!guestId1) setGuestId1(guest.id);
                            else if (!guestId2) setGuestId2(guest.id);
                            else {
                              setGuestId1(guest.id);
                              setGuestId2("");
                            }
                          }}
                          className={cn(
                            "flex w-full items-center justify-between rounded-md border px-3 py-3 text-left",
                            selected
                              ? "border-primary bg-primary-subtle"
                              : "border-border hover:bg-surface-subtle",
                          )}
                        >
                          <span>
                            <span className="font-medium text-text">
                              {formatGuestFullName(guest.lastName, guest.firstNames)}
                            </span>
                            {ticketType === TicketType.COUPLE ? (
                              <span className="mt-1 block text-xs text-text-muted">
                                {guestId1 === guest.id
                                  ? "Personne 1"
                                  : guestId2 === guest.id
                                    ? "Personne 2"
                                    : "Sélectionner"}
                              </span>
                            ) : null}
                          </span>
                          {selected ? (
                            <Check className="size-4 text-primary" aria-hidden="true" />
                          ) : null}
                        </button>
                      );
                    })
                  )}
                </div>
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                  <Button variant="secondary" onClick={() => setStep("type")}>
                    Retour
                  </Button>
                  <Button disabled={!canContinueGuests} onClick={() => setStep("table")}>
                    Continuer
                  </Button>
                </div>
              </div>
            ) : null}

            {activeStep === "table" && !isLoadingOptions ? (
              <div className="space-y-4">
                <p className="text-sm text-text-muted">
                  Places requises : {requiredSeats}. Seules les tables avec assez de places
                  libres sont listées.
                </p>
                {tables.length === 0 ? (
                  <ErrorState
                    title="Aucune table disponible"
                    message="Créez une table ou libérez des places avant de continuer."
                  />
                ) : (
                  <label className="block space-y-2 text-sm">
                    <span className="font-medium text-text">Table</span>
                    <Select
                      value={tableId}
                      onChange={(event) => setTableId(event.target.value)}
                    >
                      <option value="">Choisir une table…</option>
                      {tables.map((table) => (
                        <option key={table.id} value={table.id}>
                          {table.label} — {table.availableSeats} libre
                          {table.availableSeats > 1 ? "s" : ""} / {table.capacity}
                        </option>
                      ))}
                    </Select>
                  </label>
                )}
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                  <Button variant="secondary" onClick={() => setStep("guests")}>
                    Retour
                  </Button>
                  <Button disabled={!tableId} onClick={() => setStep("confirm")}>
                    Continuer
                  </Button>
                </div>
              </div>
            ) : null}

            {activeStep === "confirm" ? (
              <form action={formAction} className="space-y-5">
                <input type="hidden" name="type" value={ticketType} />
                <input type="hidden" name="tableId" value={tableId} />
                {ticketType === TicketType.SINGLE ? (
                  <input type="hidden" name="guestId" value={guestId} />
                ) : (
                  <>
                    <input type="hidden" name="guestId1" value={guestId1} />
                    <input type="hidden" name="guestId2" value={guestId2} />
                  </>
                )}

                <div className="rounded-md border border-border bg-surface-subtle p-4 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <TicketTypeBadge type={ticketType} />
                    <Users className="size-4 text-text-muted" aria-hidden="true" />
                  </div>
                  <p className="mt-3 font-medium text-text">
                    {formatTicketGuests(selectedGuests)}
                  </p>
                  <p className="mt-2 text-text-muted">
                    Table {selectedTable?.label ?? "—"} · {requiredSeats} place
                    {requiredSeats > 1 ? "s" : ""} · 1 QR
                  </p>
                  <p className="mt-2 text-xs text-text-muted">
                    Le QR est utilisable une seule fois. Un Couple arrive ensemble.
                  </p>
                </div>

                {state.error ? (
                  <ErrorState title="Création impossible" message={state.error} />
                ) : null}

                {isPending ? (
                  <LoadingState label="Création du billet et génération PDF…" />
                ) : (
                  <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                    <Button type="button" variant="secondary" onClick={() => setStep("table")}>
                      Retour
                    </Button>
                    <Button type="submit">Générer le billet</Button>
                  </div>
                )}
              </form>
            ) : null}

            {activeStep === "success" && successTicket ? (
              <SuccessState
                description={
                  successTicket.pdfAvailable
                    ? "Le billet et le PDF sont prêts."
                    : "Billet créé, mais le PDF n'est pas encore disponible."
                }
                details={[
                  { label: "Code", value: successTicket.shortCode },
                  {
                    label: "Invités",
                    value: formatTicketGuests(successTicket.guests),
                  },
                  { label: "Type", value: getTicketTypeLabel(successTicket.type) },
                  { label: "Table", value: successTicket.table.label },
                  {
                    label: "PDF",
                    value: successTicket.pdfAvailable ? "Disponible" : "À régénérer",
                  },
                ]}
                actions={
                  <>
                    {successTicket.pdfAvailable ? (
                      <Button
                        loading={downloadBusy}
                        onClick={() =>
                          startDownload(async () => {
                            const result = await getTicketDownloadAction(successTicket.id);
                            if (result.url) window.open(result.url, "_blank", "noopener");
                          })
                        }
                      >
                        Télécharger le PDF
                      </Button>
                    ) : (
                      <Button
                        loading={regenBusy}
                        onClick={() =>
                          startRegen(async () => {
                            const result = await regenerateTicketPdfAction(successTicket.id);
                            if (result.ticket) {
                              setSavedTicket(result.ticket);
                              toast({ title: "PDF régénéré", description: `Le PDF du billet ${result.ticket.shortCode} est prêt.`, variant: "success" });
                            }
                          })
                        }
                      >
                        Régénérer le PDF
                      </Button>
                    )}
                    <Button variant="secondary" onClick={handleClose}>
                      Fermer
                    </Button>
                  </>
                }
              />
            ) : null}

            {activeStep === "success" && successTicket ? (
              <div className="mt-4 flex justify-center">
                <TicketStatusBadge status={successTicket.status} />
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </ModalPortal>
  );
}
