"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Download,
  Archive,
  Eye,
  Grid2X2,
  List,
  MoreHorizontal,
  Pencil,
  Plus,
  Upload,
  UserX,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { GuestStatus } from "@prisma/client";

import { CancelGuestDialog } from "@/components/admin/guests/cancel-guest-dialog";
import { ArchiveGuestDialog } from "@/components/admin/guests/archive-guest-dialog";
import { BulkGuestActionDialog } from "@/components/admin/guests/bulk-guest-action-dialog";
import { GuestDetailDrawer } from "@/components/admin/guests/guest-detail-drawer";
import { GuestDialog } from "@/components/admin/guests/guest-dialog";
import { GuestImportDialog } from "@/components/admin/guests/guest-import-dialog";
import { GuestStatusBadge } from "@/components/admin/guests/guest-status-badge";
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
import {
  formatGuestFullName,
  truncateNotes,
} from "@/lib/guests";
import { cn } from "@/lib/utils";
import { exportGuestsCsvAction } from "@/server/guests/actions";
import type { GuestRecord } from "@/types/guests";

type StatusFilter = "ALL" | "ACTIVE" | "CANCELLED" | "ARCHIVED";
type ViewMode = "table" | "cards";
const DEFAULT_PAGE_SIZE = 10;

function sortGuests(guests: GuestRecord[]): GuestRecord[] {
  return [...guests].sort((left, right) => {
    const byLast = left.lastName.localeCompare(right.lastName, "fr");
    if (byLast !== 0) return byLast;
    return left.firstNames.localeCompare(right.firstNames, "fr");
  });
}

function upsertGuest(guests: GuestRecord[], nextGuest: GuestRecord): GuestRecord[] {
  const index = guests.findIndex((guest) => guest.id === nextGuest.id);
  if (index === -1) return sortGuests([...guests, nextGuest]);
  const next = [...guests];
  next[index] = nextGuest;
  return sortGuests(next);
}

function mergeImportedGuests(
  guests: GuestRecord[],
  imported: GuestRecord[],
): GuestRecord[] {
  let next = guests;
  for (const guest of imported) {
    next = upsertGuest(next, guest);
  }
  return next;
}

export interface GuestsListViewProps {
  initialGuests: GuestRecord[];
  loadError?: string;
  initialCreate?: boolean;
}

export function GuestsListView({
  initialGuests,
  loadError,
  initialCreate = false,
}: GuestsListViewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [guests, setGuests] = useState(initialGuests);
  const [previousInitialGuests, setPreviousInitialGuests] = useState(initialGuests);

  if (initialGuests !== previousInitialGuests) {
    setPreviousInitialGuests(initialGuests);
    setGuests(initialGuests);
  }

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [formTarget, setFormTarget] = useState<GuestRecord | "create" | null>(
    initialCreate ? "create" : null,
  );
  const [detailGuest, setDetailGuest] = useState<GuestRecord | null>(null);
  const [detailClosing, setDetailClosing] = useState(false);
  const [cancelGuest, setCancelGuest] = useState<GuestRecord | null>(null);
  const [archiveGuest, setArchiveGuest] = useState<GuestRecord | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<"archive" | "cancel" | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [isRefreshing, startRefresh] = useTransition();
  const [isExporting, startExport] = useTransition();

  const openDetail = (guest: GuestRecord) => {
    setDetailClosing(false);
    setDetailGuest(guest);
  };

  const closeDetail = () => {
    setDetailClosing(true);
    window.setTimeout(() => {
      setDetailGuest(null);
      setDetailClosing(false);
    }, 180);
  };

  const filteredGuests = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("fr");

    return guests.filter((guest) => {
      if (statusFilter === "ALL" && guest.status === GuestStatus.ARCHIVED) return false;
      if (statusFilter === "ACTIVE" && guest.status !== GuestStatus.ACTIVE) return false;
      if (statusFilter === "CANCELLED" && guest.status !== GuestStatus.CANCELLED) {
        return false;
      }
      if (statusFilter === "ARCHIVED" && guest.status !== GuestStatus.ARCHIVED) return false;

      if (!query) return true;

      const haystack =
        `${guest.lastName} ${guest.firstNames} ${guest.notes ?? ""}`.toLocaleLowerCase("fr");
      return haystack.includes(query);
    });
  }, [guests, search, statusFilter]);
  const pageCount = Math.max(1, Math.ceil(filteredGuests.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paginatedGuests = filteredGuests.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const selectedGuests = guests.filter((guest) => selectedIds.includes(guest.id));

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setPage(1);
  };

  const handleSearchChange = (value: string) => { setSearch(value); setPage(1); };
  const handleStatusFilterChange = (value: StatusFilter) => { setStatusFilter(value); setPage(1); };
  const handlePageSizeChange = (value: number) => { setPageSize(value); setPage(1); };
  const toggleSelected = (id: string) => setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const handleBulkSuccess = (updated: GuestRecord[]) => { setGuests((current) => updated.reduce(upsertGuest, current)); setSelectedIds([]); setBulkAction(null); toast({ title: "Action groupée appliquée", description: `${updated.length} invité${updated.length > 1 ? "s" : ""} mis à jour.`, variant: "success" }); refreshQuietly(); };

  const refreshQuietly = () => {
    startRefresh(() => {
      router.refresh();
    });
  };

  const handleFormSuccess = (guest: GuestRecord) => {
    setGuests((current) => upsertGuest(current, guest));
    refreshQuietly();
  };

  const handleCancelSuccess = (guest: GuestRecord) => {
    setGuests((current) => upsertGuest(current, guest));
    setCancelGuest(null);
    toast({
      title: "Invité annulé",
      description: "La personne reste consultable mais ne pourra plus recevoir de billet.",
      variant: "success",
    });
    refreshQuietly();
  };

  const handleArchiveSuccess = (guest: GuestRecord) => {
    setGuests((current) => upsertGuest(current, guest));
    setArchiveGuest(null);
    toast({ title: "Invité archivé", description: "La personne reste conservée dans l’historique.", variant: "success" });
    refreshQuietly();
  };

  const handleImportSuccess = (imported: GuestRecord[]) => {
    setGuests((current) => mergeImportedGuests(current, imported));
    toast({
      title: "Import réussi",
      description: `${imported.length} invité${imported.length > 1 ? "s" : ""} ajouté${imported.length > 1 ? "s" : ""}.`,
      variant: "success",
    });
    refreshQuietly();
  };

  const handleExport = () => {
    startExport(async () => {
      const result = await exportGuestsCsvAction();

      if (result.error || !result.csv || !result.filename) {
        toast({
          title: "Export impossible",
          description: result.error ?? "Une erreur est survenue.",
          variant: "error",
        });
        return;
      }

      const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = result.filename;
      anchor.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Export prêt",
        description: "Le fichier CSV a été téléchargé.",
        variant: "success",
      });
    });
  };

  if (loadError) {
    return (
      <div className="space-y-5">
        <PageHeader
          title="Invités"
          description="Gérez les personnes invitées avant la création des billets."
        />
        <ErrorState
          title="Impossible de charger les invités"
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
        title="Invités"
        description="Gérez les personnes invitées avant la création des billets."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setImportOpen(true)}>
              <Upload className="size-4" aria-hidden="true" /> Importer un CSV
            </Button>
            <Button
              variant="secondary"
              onClick={handleExport}
              loading={isExporting}
              disabled={isExporting || guests.length === 0}
            >
              <Download className="size-4" aria-hidden="true" /> Exporter CSV
            </Button>
            <Button onClick={() => setFormTarget("create")}>
              <Plus className="size-4" aria-hidden="true" /> Ajouter un invité
            </Button>
          </div>
        }
      />

      {guests.length === 0 ? (
        <EmptyState
          title="Aucun invité enregistré"
          description="Ajoutez des personnes une par une ou importez un fichier CSV."
          actionLabel="Ajouter un invité"
          onAction={() => setFormTarget("create")}
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
                resultCount={filteredGuests.length}
                resultLabel={
                  filteredGuests.length > 1 ? "invités affichés" : "invité affiché"
                }
                onReset={search || statusFilter !== "ALL" ? resetFilters : undefined}
              >
                <div className="min-w-[220px] flex-1">
                  <SearchInput
                    value={search}
                    onValueChange={handleSearchChange}
                    placeholder="Rechercher un invité…"
                    label="Rechercher un invité"
                  />
                </div>
                <div className="min-w-[180px]">
                  <label htmlFor="guest-status-filter" className="sr-only">
                    Filtrer par statut
                  </label>
                  <Select
                    id="guest-status-filter"
                    value={statusFilter}
                    onChange={(event) => handleStatusFilterChange(event.target.value as StatusFilter)}
                  >
                    <option value="ALL">Tous les statuts</option>
                    <option value="ACTIVE">Actifs</option>
                    <option value="CANCELLED">Annulés</option>
                    <option value="ARCHIVED">Archivés</option>
                  </Select>
                </div>
                <div
                  className="hidden items-center border border-border bg-surface-subtle p-0.5 md:flex"
                  aria-label="Mode d'affichage"
                >
                  <button
                    type="button"
                    onClick={() => setViewMode("table")}
                    aria-label="Vue tableau"
                    title="Vue tableau"
                    aria-pressed={viewMode === "table"}
                    className={cn(
                      "flex size-9 items-center justify-center rounded-sm text-text-muted",
                      viewMode === "table" && "bg-surface text-text shadow-sm",
                    )}
                  >
                    <List className="size-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("cards")}
                    aria-label="Vue cartes"
                    title="Vue cartes"
                    aria-pressed={viewMode === "cards"}
                    className={cn(
                      "flex size-9 items-center justify-center rounded-sm text-text-muted",
                      viewMode === "cards" && "bg-surface text-text shadow-sm",
                    )}
                  >
                    <Grid2X2 className="size-4" aria-hidden="true" />
                  </button>
                </div>
              </FilterBar>
            </div>
          </div>

          {filteredGuests.length === 0 ? (
            <EmptyState
              title="Aucun résultat"
              description="Aucun invité ne correspond à votre recherche ou à vos filtres."
              actionLabel="Réinitialiser les filtres"
              onAction={resetFilters}
            />
          ) : (
            <>
              {selectedGuests.length > 0 ? <div className="flex flex-wrap items-center gap-3 border border-primary/30 bg-primary-subtle p-3"><p className="text-sm font-medium text-text">{selectedGuests.length} sélectionné{selectedGuests.length > 1 ? "s" : ""}</p><Button size="sm" variant="secondary" onClick={() => setBulkAction("cancel")} disabled={selectedGuests.some((guest) => guest.status !== GuestStatus.ACTIVE)}>Annuler la sélection</Button><Button size="sm" onClick={() => setBulkAction("archive")} disabled={selectedGuests.some((guest) => guest.status === GuestStatus.ARCHIVED)}>Archiver la sélection</Button><Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>Désélectionner</Button></div> : null}
              {viewMode === "table" ? (
                <div className="hidden overflow-x-auto md:block">
                  <Surface className="overflow-hidden">
                    <table className="min-w-full text-sm">
                      <thead className="border-b border-border bg-surface-subtle">
                        <tr>
                          {["", "Invité", "Statut", "Notes", "Actions"].map((header) => (
                            <th
                              key={header}
                              scope="col"
                              className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-text-muted"
                            >
                              {header || <span className="sr-only">Sélection</span>}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {paginatedGuests.map((guest) => {
                          const fullName = formatGuestFullName(
                            guest.lastName,
                            guest.firstNames,
                          );
                          const cancelled = guest.status === GuestStatus.CANCELLED;

                          return (
                            <tr
                              key={guest.id}
                              className={cn(
                                "hover:bg-surface-subtle/60",
                                cancelled && "bg-surface-subtle/40 text-text-muted",
                              )}
                            >
                              <td className="px-4 py-3"><input type="checkbox" aria-label={`Sélectionner ${fullName}`} checked={selectedIds.includes(guest.id)} onChange={() => toggleSelected(guest.id)} className="size-4 accent-primary" /></td>
                              <td className="px-4 py-3">
                                <button
                                  type="button"
                                  className={cn(
                                    "text-left font-medium hover:text-primary-hover",
                                    cancelled ? "text-text-muted" : "text-text",
                                  )}
                                  onClick={() => openDetail(guest)}
                                >
                                  {fullName}
                                </button>
                              </td>
                              <td className="px-4 py-3">
                                <GuestStatusBadge status={guest.status} />
                              </td>
                              <td className="max-w-[220px] px-4 py-3 text-text-muted">
                                {truncateNotes(guest.notes) || "—"}
                              </td>
                              <td className="px-4 py-3">
                                <GuestRowActions
                                  guest={guest}
                                  onView={() => openDetail(guest)}
                                  onEdit={() => setFormTarget(guest)}
                                  onCancel={() => setCancelGuest(guest)}
                                  onArchive={() => setArchiveGuest(guest)}
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </Surface>
                </div>
              ) : (
                <GuestCards
                  guests={paginatedGuests}
                  onView={openDetail}
                  onEdit={setFormTarget}
                  onCancel={setCancelGuest}
                  onArchive={setArchiveGuest}
                />
              )}

              <div className="md:hidden">
                <MobileList
                  items={paginatedGuests.map((guest) => ({
                    id: guest.id,
                    title: formatGuestFullName(guest.lastName, guest.firstNames),
                    subtitle: truncateNotes(guest.notes) || "Sans note",
                    badges: <GuestStatusBadge status={guest.status} />,
                    onClick: () => openDetail(guest),
                  }))}
                />
              </div>
              <Pagination page={currentPage} totalItems={filteredGuests.length} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={handlePageSizeChange} itemLabel="invités" />
            </>
          )}
        </>
      )}

      <GuestDialog
        key={
          formTarget === null
            ? "closed"
            : formTarget === "create"
              ? "create"
              : `edit-${formTarget.id}`
        }
        open={formTarget !== null}
        mode={formTarget === "create" ? "create" : "edit"}
        guest={formTarget && formTarget !== "create" ? formTarget : undefined}
        onClose={() => setFormTarget(null)}
        onSuccess={handleFormSuccess}
      />

      <GuestDetailDrawer
        guest={detailGuest}
        open={detailGuest !== null && !detailClosing}
        onClose={closeDetail}
        onEdit={(guest) => setFormTarget(guest)}
      />

      {cancelGuest ? (
        <CancelGuestDialog
          key={cancelGuest.id}
          guest={cancelGuest}
          open
          onClose={() => setCancelGuest(null)}
          onSuccess={handleCancelSuccess}
        />
      ) : null}

      {archiveGuest ? <ArchiveGuestDialog guest={archiveGuest} onClose={() => setArchiveGuest(null)} onSuccess={handleArchiveSuccess} /> : null}
      {bulkAction ? <BulkGuestActionDialog action={bulkAction} guests={selectedGuests} onClose={() => setBulkAction(null)} onSuccess={handleBulkSuccess} /> : null}

      <GuestImportDialog
        key={importOpen ? "import-open" : "import-closed"}
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onSuccess={handleImportSuccess}
      />
    </div>
  );
}

function GuestRowActions({
  guest,
  onView,
  onEdit,
  onCancel,
  onArchive,
}: {
  guest: GuestRecord;
  onView: () => void;
  onEdit: () => void;
  onCancel: () => void;
  onArchive: () => void;
}) {
  const canEdit = guest.status === GuestStatus.ACTIVE;
  const canCancel = guest.status === GuestStatus.ACTIVE;
  const canArchive = guest.status !== GuestStatus.ARCHIVED;
  const fullName = formatGuestFullName(guest.lastName, guest.firstNames);

  return (
    <div className="flex items-center justify-start gap-1">
      <button
        type="button"
        onClick={onView}
        className="inline-flex size-11 items-center justify-center rounded-sm text-text-muted hover:bg-surface-subtle hover:text-text"
        aria-label={`Voir ${fullName}`}
        title="Voir"
      >
        <Eye className="size-4" aria-hidden="true" />
      </button>
      {canEdit ? (
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex size-11 items-center justify-center rounded-sm text-text-muted hover:bg-surface-subtle hover:text-text"
          aria-label={`Modifier ${fullName}`}
          title="Modifier"
        >
          <Pencil className="size-4" aria-hidden="true" />
        </button>
      ) : null}
      {canCancel || canArchive ? (
        <details className="group relative">
          <summary
            className="flex size-11 cursor-pointer list-none items-center justify-center rounded-sm text-text-muted hover:bg-surface-subtle hover:text-text"
            aria-label={`Plus d’actions pour ${fullName}`}
            title="Plus d’actions"
          >
            <MoreHorizontal className="size-4" aria-hidden="true" />
          </summary>
          <div className="absolute right-0 top-11 z-20 w-52 border border-border bg-surface p-1 shadow-overlay">
            <button
              type="button"
              onClick={onCancel}
              className="flex min-h-11 w-full items-center gap-2 px-3 text-left text-sm text-danger hover:bg-danger-subtle"
            >
              <UserX className="size-4" aria-hidden="true" /> Annuler l&apos;invité
            </button>
            {canArchive ? <button type="button" onClick={onArchive} className="flex min-h-11 w-full items-center gap-2 px-3 text-left text-sm text-text hover:bg-surface-subtle"><Archive className="size-4" aria-hidden="true" /> Archiver l’invité</button> : null}
          </div>
        </details>
      ) : null}
    </div>
  );
}

function GuestCards({
  guests,
  onView,
  onEdit,
  onCancel,
  onArchive,
}: {
  guests: GuestRecord[];
  onView: (guest: GuestRecord) => void;
  onEdit: (guest: GuestRecord) => void;
  onCancel: (guest: GuestRecord) => void;
  onArchive: (guest: GuestRecord) => void;
}) {
  return (
    <div className="hidden grid-cols-1 gap-3 md:grid lg:grid-cols-2 xl:grid-cols-3">
      {guests.map((guest) => {
        const cancelled = guest.status === GuestStatus.CANCELLED;
        return (
          <Surface
            key={guest.id}
            className={cn("p-4", cancelled && "bg-surface-subtle/50")}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <button
                  type="button"
                  onClick={() => onView(guest)}
                  className={cn(
                    "block truncate text-left font-semibold hover:text-primary-hover",
                    cancelled ? "text-text-muted" : "text-text",
                  )}
                >
                  {formatGuestFullName(guest.lastName, guest.firstNames)}
                </button>
                <p className="mt-1 text-sm text-text-muted">
                  {truncateNotes(guest.notes, 64) || "Sans note"}
                </p>
              </div>
              <GuestStatusBadge status={guest.status} />
            </div>
            <div className="mt-4 border-t border-border pt-3">
              <GuestRowActions
                guest={guest}
                onView={() => onView(guest)}
                onEdit={() => onEdit(guest)}
                onCancel={() => onCancel(guest)}
                onArchive={() => onArchive(guest)}
              />
            </div>
          </Surface>
        );
      })}
    </div>
  );
}
