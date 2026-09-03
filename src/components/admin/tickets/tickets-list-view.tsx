"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Armchair,
  Download,
  Eye,
  FileCheck2,
  FileWarning,
  Grid2X2,
  List,
  MoreHorizontal,
  Plus,
  RefreshCw,
  TicketX,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { TicketStatus, TicketType } from "@prisma/client";

import { CancelTicketDialog } from "@/components/admin/tickets/cancel-ticket-dialog";
import { BulkTicketActionDialog } from "@/components/admin/tickets/bulk-ticket-action-dialog";
import { CreateTicketDialog } from "@/components/admin/tickets/create-ticket-dialog";
import { TicketDetailDialog } from "@/components/admin/tickets/ticket-detail-dialog";
import { TicketStatusBadge, TicketTypeBadge } from "@/components/admin/tickets/ticket-status-badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { FilterBar } from "@/components/ui/filter-bar";
import { MobileList } from "@/components/ui/mobile-list";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { Surface } from "@/components/ui/surface";
import { useToast } from "@/components/ui/toast";
import { formatTicketGuests } from "@/lib/tickets";
import { cn } from "@/lib/utils";
import {
  getTicketDownloadAction,
  regenerateTicketPdfAction,
} from "@/server/tickets/actions";
import type { TicketRecord } from "@/types/tickets";

type ViewMode = "table" | "cards";
const DEFAULT_PAGE_SIZE = 10;

function upsertTicket(tickets: TicketRecord[], next: TicketRecord): TicketRecord[] {
  const index = tickets.findIndex((ticket) => ticket.id === next.id);
  if (index === -1) return [next, ...tickets];
  const copy = [...tickets];
  copy[index] = next;
  return copy;
}

export interface TicketsListViewProps {
  initialTickets: TicketRecord[];
  loadError?: string;
}

export function TicketsListView({ initialTickets, loadError }: TicketsListViewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [tickets, setTickets] = useState(initialTickets);
  const [previous, setPrevious] = useState(initialTickets);
  if (initialTickets !== previous) {
    setPrevious(initialTickets);
    setTickets(initialTickets);
  }

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | TicketStatus>("ALL");
  const [typeFilter, setTypeFilter] = useState<"ALL" | TicketType>("ALL");
  const [tableFilter, setTableFilter] = useState("ALL");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailTicket, setDetailTicket] = useState<TicketRecord | null>(null);
  const [cancelTicket, setCancelTicket] = useState<TicketRecord | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<"cancel" | "regenerate" | null>(null);
  const [isRefreshing, startRefresh] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  const tableOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const ticket of tickets) map.set(ticket.table.id, ticket.table.label);
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1], "fr"));
  }, [tickets]);

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("fr");
    return tickets.filter((ticket) => {
      if (statusFilter !== "ALL" && ticket.status !== statusFilter) return false;
      if (typeFilter !== "ALL" && ticket.type !== typeFilter) return false;
      if (tableFilter !== "ALL" && ticket.table.id !== tableFilter) return false;
      if (!query) return true;
      const haystack =
        `${ticket.shortCode} ${formatTicketGuests(ticket.guests)} ${ticket.table.label}`.toLocaleLowerCase(
          "fr",
        );
      return haystack.includes(query);
    });
  }, [search, statusFilter, tableFilter, tickets, typeFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const selectedTickets = tickets.filter((ticket) => selectedIds.includes(ticket.id));

  const refreshQuietly = () => startRefresh(() => router.refresh());
  const toggleSelected = (id: string) => setSelectedIds((current) => current.includes(id) ? current.filter((selected) => selected !== id) : [...current, id]);
  const handleBulkSuccess = (updated: TicketRecord[]) => {
    setTickets((current) => current.map((ticket) => updated.find((next) => next.id === ticket.id) ?? ticket));
    setSelectedIds([]);
    setBulkAction(null);
    toast({ title: updated.length > 1 ? "Action groupée terminée" : "Action terminée", description: bulkAction === "cancel" ? `${updated.length} billet${updated.length > 1 ? "s" : ""} annulé${updated.length > 1 ? "s" : ""}.` : `${updated.length} PDF régénéré${updated.length > 1 ? "s" : ""}.`, variant: "success" });
    refreshQuietly();
  };

  const handleCreated = (ticket: TicketRecord) => {
    setTickets((current) => upsertTicket(current, ticket));
    toast({
      title: "Billet créé",
      description: ticket.pdfAvailable
        ? `Le billet ${ticket.shortCode} est prêt.`
        : `Billet ${ticket.shortCode} créé — PDF à régénérer.`,
      variant: "success",
    });
    refreshQuietly();
  };

  const handleDownload = async (ticket: TicketRecord) => {
    setBusyId(ticket.id);
    const result = await getTicketDownloadAction(ticket.id);
    setBusyId(null);
    if (result.error || !result.url) {
      toast({
        title: "Téléchargement impossible",
        description: result.error ?? "PDF indisponible.",
        variant: "error",
      });
      return;
    }
    window.open(result.url, "_blank", "noopener");
  };

  const handleRegenerate = async (ticket: TicketRecord) => {
    setBusyId(ticket.id);
    const result = await regenerateTicketPdfAction(ticket.id);
    setBusyId(null);
    if (result.error || !result.ticket) {
      toast({
        title: "Régénération impossible",
        description: result.error ?? "Erreur PDF.",
        variant: "error",
      });
      return;
    }
    setTickets((current) => upsertTicket(current, result.ticket!));
    if (detailTicket?.id === result.ticket.id) setDetailTicket(result.ticket);
    toast({
      title: "PDF régénéré",
      description: `Le PDF du billet ${result.ticket.shortCode} est à jour.`,
      variant: "success",
    });
    refreshQuietly();
  };

  if (loadError) {
    return (
      <div className="space-y-5">
        <PageHeader title="Billets" description="Création Single/Couple, PDF et cycle de vie." />
        <ErrorState
          title="Impossible de charger les billets"
          message={loadError}
          onRetry={() => startRefresh(() => router.refresh())}
          retryLabel={isRefreshing ? "Actualisation…" : "Réessayer"}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Billets"
        description="Création Single/Couple, génération PDF et cycle de vie des billets."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" aria-hidden="true" /> Créer un billet
          </Button>
        }
      />

      {tickets.length === 0 ? (
        <EmptyState
          title="Aucun billet"
          description="Créez un billet Single ou Couple pour générer un QR et un PDF."
          actionLabel="Créer un billet"
          onAction={() => setCreateOpen(true)}
        />
      ) : (
        <>
          <div className="space-y-3">
            <div className="md:hidden">
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => setFiltersOpen((open) => !open)}
              >
                {filtersOpen ? "Masquer les filtres" : "Afficher les filtres"}
              </Button>
            </div>
            <div className={cn("space-y-3", !filtersOpen && "hidden md:block")}>
              <FilterBar
                className="gap-2 p-2.5 shadow-sm"
                resultCount={filtered.length}
                resultLabel={filtered.length > 1 ? "billets affichés" : "billet affiché"}
                onReset={
                  search || statusFilter !== "ALL" || typeFilter !== "ALL" || tableFilter !== "ALL"
                    ? () => {
                        setSearch("");
                        setStatusFilter("ALL");
                        setTypeFilter("ALL");
                        setTableFilter("ALL");
                        setPage(1);
                      }
                    : undefined
                }
              >
                <div className="min-w-[260px] flex-1">
                  <SearchInput
                    value={search}
                    onValueChange={(value) => {
                      setSearch(value);
                      setPage(1);
                    }}
                    placeholder="Rechercher code ou invité…"
                    label="Rechercher un billet"
                  />
                </div>
                <Select
                  className="w-[154px] shrink-0 text-sm"
                  value={typeFilter}
                  onChange={(event) => {
                    setTypeFilter(event.target.value as "ALL" | TicketType);
                    setPage(1);
                  }}
                  aria-label="Filtrer par type"
                >
                  <option value="ALL">Tous les types</option>
                  <option value={TicketType.SINGLE}>Single</option>
                  <option value={TicketType.COUPLE}>Couple</option>
                </Select>
                <Select
                  className="w-[166px] shrink-0 text-sm"
                  value={statusFilter}
                  onChange={(event) => {
                    setStatusFilter(event.target.value as "ALL" | TicketStatus);
                    setPage(1);
                  }}
                  aria-label="Filtrer par statut"
                >
                  <option value="ALL">Tous les statuts</option>
                  <option value={TicketStatus.ACTIVE}>Actifs</option>
                  <option value={TicketStatus.USED}>Utilisés</option>
                  <option value={TicketStatus.CANCELLED}>Annulés</option>
                  <option value={TicketStatus.REVOKED}>Révoqués</option>
                </Select>
                <Select
                  className="w-[176px] shrink-0 text-sm"
                  value={tableFilter}
                  onChange={(event) => {
                    setTableFilter(event.target.value);
                    setPage(1);
                  }}
                  aria-label="Filtrer par table"
                >
                  <option value="ALL">Toutes les tables</option>
                  {tableOptions.map(([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </Select>
                <div
                  className="hidden shrink-0 items-center border border-border bg-surface-subtle p-0.5 md:flex"
                  aria-label="Mode d'affichage"
                >
                  <button
                    type="button"
                    onClick={() => setViewMode("table")}
                    aria-label="Vue tableau"
                    aria-pressed={viewMode === "table"}
                    className={cn(
                      "flex size-9 items-center justify-center rounded-sm text-text-muted transition-colors duration-150 hover:text-text",
                      viewMode === "table" && "bg-surface text-text shadow-sm",
                    )}
                  >
                    <List className="size-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("cards")}
                    aria-label="Vue cartes"
                    aria-pressed={viewMode === "cards"}
                    className={cn(
                      "flex size-9 items-center justify-center rounded-sm text-text-muted transition-colors duration-150 hover:text-text",
                      viewMode === "cards" && "bg-surface text-text shadow-sm",
                    )}
                  >
                    <Grid2X2 className="size-4" aria-hidden="true" />
                  </button>
                </div>
              </FilterBar>
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              title="Aucun résultat"
              description="Aucun billet ne correspond à vos filtres."
              actionLabel="Réinitialiser les filtres"
              onAction={() => {
                setSearch("");
                setStatusFilter("ALL");
                setTypeFilter("ALL");
                setTableFilter("ALL");
              }}
            />
          ) : (
            <>
              {selectedTickets.length > 0 ? <div className="flex flex-wrap items-center gap-3 border border-primary/30 bg-primary-subtle p-3"><p className="text-sm font-medium text-text">{selectedTickets.length} billet{selectedTickets.length > 1 ? "s" : ""} sélectionné{selectedTickets.length > 1 ? "s" : ""}</p><Button size="sm" variant="secondary" onClick={() => setBulkAction("regenerate")} disabled={selectedTickets.some((ticket) => ticket.status !== TicketStatus.ACTIVE && ticket.status !== TicketStatus.USED) || selectedTickets.length > 20}>Régénérer les PDF</Button><Button size="sm" variant="danger" onClick={() => setBulkAction("cancel")} disabled={selectedTickets.some((ticket) => ticket.status !== TicketStatus.ACTIVE && ticket.status !== TicketStatus.USED)}>Annuler la sélection</Button><Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>Désélectionner</Button>{selectedTickets.length > 20 ? <p className="text-xs text-text-muted">La régénération est limitée à 20 billets à la fois.</p> : null}</div> : null}
              {viewMode === "table" ? (
                <div className="hidden overflow-x-auto md:block">
                  <Surface className="overflow-hidden shadow-sm">
                    <table className="min-w-full text-sm">
                      <thead className="border-b border-border bg-surface-subtle">
                        <tr>
                          {["", "Code", "Invités", "Type", "Table", "Statut", "PDF", "Actions"].map(
                            (header) => (
                              <th
                                key={header}
                                className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-text-muted"
                              >
                                {header || <span className="sr-only">Sélection</span>}
                              </th>
                            ),
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {paginated.map((ticket) => (
                          <tr
                            key={ticket.id}
                            className="group transition-colors duration-150 hover:bg-surface-subtle/80"
                          >
                            <td className="px-4 py-3.5"><input type="checkbox" aria-label={`Sélectionner le billet ${ticket.shortCode}`} checked={selectedIds.includes(ticket.id)} onChange={() => toggleSelected(ticket.id)} className="size-4 accent-primary" /></td>
                            <td className="px-4 py-3.5">
                              <span className="inline-flex rounded-sm border border-border bg-surface-subtle px-2 py-1 font-mono text-xs font-semibold tracking-wide text-text">
                                {ticket.shortCode}
                              </span>
                            </td>
                            <td className="max-w-[420px] px-4 py-3.5 text-text">
                              <p className="truncate font-medium" title={formatTicketGuests(ticket.guests)}>
                                {formatTicketGuests(ticket.guests)}
                              </p>
                              <p className="mt-0.5 text-xs text-text-muted">
                                {ticket.guests.length} {ticket.guests.length > 1 ? "invités" : "invité"}
                              </p>
                            </td>
                            <td className="px-4 py-3">
                              <TicketTypeBadge type={ticket.type} />
                            </td>
                            <td className="px-4 py-3.5">
                              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-text">
                                <Armchair className="size-3.5 text-text-muted" aria-hidden="true" />
                                {ticket.table.label}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <TicketStatusBadge status={ticket.status} />
                            </td>
                            <td className="px-4 py-3.5">
                              {ticket.pdfAvailable ? (
                                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-success">
                                  <FileCheck2 className="size-4" aria-hidden="true" /> Prêt
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-warning">
                                  <FileWarning className="size-4" aria-hidden="true" /> À régénérer
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <TicketRowActions
                                ticket={ticket}
                                busy={busyId === ticket.id}
                                onView={() => setDetailTicket(ticket)}
                                onDownload={() => void handleDownload(ticket)}
                                onRegenerate={() => void handleRegenerate(ticket)}
                                onCancel={() => setCancelTicket(ticket)}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Surface>
                </div>
              ) : (
                <div className="hidden grid-cols-1 gap-3 md:grid lg:grid-cols-2">
                  {paginated.map((ticket) => (
                    <Surface
                      key={ticket.id}
                      className="p-4 shadow-sm transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-text-muted hover:shadow-overlay"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="inline-flex rounded-sm border border-border bg-surface-subtle px-2 py-1 font-mono text-xs font-semibold tracking-wide text-text">
                            {ticket.shortCode}
                          </p>
                          <p className="mt-2 text-sm font-medium text-text">
                            {formatTicketGuests(ticket.guests)}
                          </p>
                          <p className="mt-1 flex items-center gap-1.5 text-sm text-text-muted">
                            <Armchair className="size-3.5" aria-hidden="true" /> {ticket.table.label}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <TicketTypeBadge type={ticket.type} />
                          <TicketStatusBadge status={ticket.status} />
                        </div>
                      </div>
                      <div className="mt-4 border-t border-border pt-3">
                        <TicketRowActions
                          ticket={ticket}
                          busy={busyId === ticket.id}
                          onView={() => setDetailTicket(ticket)}
                          onDownload={() => void handleDownload(ticket)}
                          onRegenerate={() => void handleRegenerate(ticket)}
                          onCancel={() => setCancelTicket(ticket)}
                        />
                      </div>
                    </Surface>
                  ))}
                </div>
              )}

              <div className="md:hidden">
                <MobileList
                  items={paginated.map((ticket) => ({
                    id: ticket.id,
                    title: ticket.shortCode,
                    subtitle: `${formatTicketGuests(ticket.guests)} · ${ticket.table.label}`,
                    badges: (
                      <span className="flex flex-wrap gap-2">
                        <TicketTypeBadge type={ticket.type} />
                        <TicketStatusBadge status={ticket.status} />
                      </span>
                    ),
                    onClick: () => setDetailTicket(ticket),
                  }))}
                />
              </div>

              <Pagination
                page={currentPage}
                totalItems={filtered.length}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setPage(1);
                }}
                itemLabel="billets"
              />
            </>
          )}
        </>
      )}

      <CreateTicketDialog
        key={createOpen ? "create-open" : "create-closed"}
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={handleCreated}
      />

      <TicketDetailDialog
        ticket={detailTicket}
        open={detailTicket !== null}
        onClose={() => setDetailTicket(null)}
        onTicketUpdated={(ticket) => {
          setTickets((current) => upsertTicket(current, ticket));
          setDetailTicket(ticket);
        }}
        onCancelRequest={setCancelTicket}
      />

      {cancelTicket ? (
        <CancelTicketDialog
          key={cancelTicket.id}
          ticket={cancelTicket}
          open
          onClose={() => setCancelTicket(null)}
          onSuccess={(ticket) => {
            setTickets((current) => upsertTicket(current, ticket));
            setCancelTicket(null);
            if (detailTicket?.id === ticket.id) setDetailTicket(ticket);
            toast({
              title: "Billet annulé",
              description: `Le billet ${ticket.shortCode} n'est plus valide. Places libérées.`,
              variant: "success",
            });
            refreshQuietly();
          }}
        />
      ) : null}
      {bulkAction ? <BulkTicketActionDialog action={bulkAction} tickets={selectedTickets} onClose={() => setBulkAction(null)} onSuccess={handleBulkSuccess} /> : null}
    </div>
  );
}

function TicketRowActions({
  ticket,
  busy,
  onView,
  onDownload,
  onRegenerate,
  onCancel,
}: {
  ticket: TicketRecord;
  busy: boolean;
  onView: () => void;
  onDownload: () => void;
  onRegenerate: () => void;
  onCancel: () => void;
}) {
  const canCancel =
    ticket.status === TicketStatus.ACTIVE || ticket.status === TicketStatus.USED;

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={onView}
        className="inline-flex size-11 items-center justify-center rounded-sm text-text-muted hover:bg-surface-subtle hover:text-text"
        aria-label={`Voir ${ticket.shortCode}`}
        title="Voir"
      >
        <Eye className="size-4" aria-hidden="true" />
      </button>
      {ticket.pdfAvailable ? (
        <button
          type="button"
          onClick={onDownload}
          disabled={busy}
          className="inline-flex size-11 items-center justify-center rounded-sm text-text-muted hover:bg-surface-subtle hover:text-text disabled:opacity-50"
          aria-label={`Télécharger ${ticket.shortCode}`}
          title="Télécharger"
        >
          <Download className="size-4" aria-hidden="true" />
        </button>
      ) : null}
      <details className="group relative">
        <summary
          className="flex size-11 cursor-pointer list-none items-center justify-center rounded-sm text-text-muted hover:bg-surface-subtle hover:text-text"
          aria-label={`Plus d’actions pour ${ticket.shortCode}`}
        >
          <MoreHorizontal className="size-4" aria-hidden="true" />
        </summary>
        <div className="absolute right-0 top-11 z-20 w-56 border border-border bg-surface p-1 shadow-overlay">
          <button
            type="button"
            onClick={onRegenerate}
            disabled={busy || ticket.status === TicketStatus.CANCELLED}
            className="flex min-h-11 w-full items-center gap-2 px-3 text-left text-sm text-text hover:bg-surface-subtle disabled:opacity-50"
          >
            <RefreshCw className="size-4" aria-hidden="true" /> Régénérer le PDF
          </button>
          {canCancel ? (
            <button
              type="button"
              onClick={onCancel}
              className="flex min-h-11 w-full items-center gap-2 px-3 text-left text-sm text-danger hover:bg-danger-subtle"
            >
              <TicketX className="size-4" aria-hidden="true" /> Annuler le billet
            </button>
          ) : null}
        </div>
      </details>
    </div>
  );
}
