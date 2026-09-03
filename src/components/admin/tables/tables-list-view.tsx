"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { Eye, Grid2X2, List, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { DeleteTableDialog } from "@/components/admin/tables/delete-table-dialog";
import { BulkDeleteTablesDialog } from "@/components/admin/tables/bulk-delete-tables-dialog";
import { TableDialog } from "@/components/admin/tables/table-dialog";
import { TableStatusBadge } from "@/components/admin/tables/table-status-badge";
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
import { cn } from "@/lib/utils";
import type { TableCapacityStatus, TableWithStats } from "@/types/tables";

type StatusFilter = "ALL" | TableCapacityStatus;
type ViewMode = "table" | "cards";
const DEFAULT_PAGE_SIZE = 10;

function sortTables(tables: TableWithStats[]): TableWithStats[] {
  return [...tables].sort((left, right) => left.label.localeCompare(right.label, "fr"));
}

function upsertTable(tables: TableWithStats[], nextTable: TableWithStats): TableWithStats[] {
  const existingIndex = tables.findIndex((table) => table.id === nextTable.id);

  if (existingIndex === -1) {
    return sortTables([...tables, nextTable]);
  }

  const nextTables = [...tables];
  nextTables[existingIndex] = nextTable;
  return sortTables(nextTables);
}

export interface TablesListViewProps {
  initialTables: TableWithStats[];
  loadError?: string;
  initialCreate?: boolean;
}

export function TablesListView({
  initialTables,
  loadError,
  initialCreate = false,
}: TablesListViewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [tables, setTables] = useState(initialTables);
  const [previousInitialTables, setPreviousInitialTables] = useState(initialTables);
  if (initialTables !== previousInitialTables) {
    setPreviousInitialTables(initialTables);
    setTables(initialTables);
  }
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [deleteTarget, setDeleteTarget] = useState<TableWithStats | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [formTarget, setFormTarget] = useState<TableWithStats | "create" | null>(initialCreate ? "create" : null);
  const [isRefreshing, startRefresh] = useTransition();
  const filteredTables = useMemo(() => tables.filter((table) => (!search.trim() || table.label.toLowerCase().includes(search.trim().toLowerCase())) && (statusFilter === "ALL" || table.status === statusFilter)), [search, statusFilter, tables]);
  const pageCount = Math.max(1, Math.ceil(filteredTables.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paginatedTables = filteredTables.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const selectedTables = tables.filter((table) => selectedIds.includes(table.id));

  const resetFilters = () => { setSearch(""); setStatusFilter("ALL"); setPage(1); };
  const handleSearchChange = (value: string) => { setSearch(value); setPage(1); };
  const handleStatusFilterChange = (value: StatusFilter) => { setStatusFilter(value); setPage(1); };
  const handlePageSizeChange = (value: number) => { setPageSize(value); setPage(1); };
  const toggleSelected = (id: string) => setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const handleBulkDeleted = (ids: string[]) => { setTables((current) => current.filter((table) => !ids.includes(table.id))); setSelectedIds([]); setBulkDeleteOpen(false); toast({ title: "Tables supprimées", description: `${ids.length} table${ids.length > 1 ? "s" : ""} retirée${ids.length > 1 ? "s" : ""} de la configuration.`, variant: "success" }); startRefresh(() => router.refresh()); };
  const closeForm = () => setFormTarget(null);
  const handleFormSuccess = (table: TableWithStats) => {
    setTables((current) => upsertTable(current, table));
    toast({ title: formTarget === "create" ? "Table créée" : "Table mise à jour", description: `« ${table.label} » a été enregistrée.`, variant: "success" });
    startRefresh(() => {
      router.refresh();
    });
  };

  if (loadError) return <div className="space-y-5"><PageHeader title="Tables" description="Configurez les tables et leur capacité avant d'attribuer les invités." /><ErrorState title="Impossible de charger les tables" message={loadError} onRetry={() => startRefresh(() => router.refresh())} retryLabel={isRefreshing ? "Actualisation…" : "Réessayer"} /></div>;

  return <div className="space-y-5">
    <PageHeader title="Tables" description="Configurez les tables et leur capacité avant d'attribuer les invités." actions={<Button onClick={() => setFormTarget("create")}><Plus className="size-4" aria-hidden="true" /> Ajouter une table</Button>} />
    {tables.length === 0 ? <EmptyState title="Aucune table configurée" description="Créez les tables avant d'attribuer les places aux invités." actionLabel="Ajouter une table" onAction={() => setFormTarget("create")} /> : <>
      <div className="space-y-3">
        <div className="md:hidden"><Button variant="secondary" className="w-full" onClick={() => setFiltersOpen((open) => !open)}>{filtersOpen ? "Masquer les filtres" : "Afficher les filtres"}</Button></div>
        <div className={cn("space-y-3", !filtersOpen && "hidden md:block")}><FilterBar resultCount={filteredTables.length} resultLabel={filteredTables.length > 1 ? "tables affichées" : "table affichée"} onReset={search || statusFilter !== "ALL" ? resetFilters : undefined}>
          <div className="min-w-[220px] flex-1"><SearchInput value={search} onValueChange={handleSearchChange} placeholder="Rechercher une table…" label="Rechercher une table" /></div>
          <div className="min-w-[180px]"><label htmlFor="table-status-filter" className="sr-only">Filtrer par statut</label><Select id="table-status-filter" value={statusFilter} onChange={(event) => handleStatusFilterChange(event.target.value as StatusFilter)}><option value="ALL">Tous les statuts</option><option value="AVAILABLE">Disponible</option><option value="FULL">Complète</option></Select></div>
          <div className="hidden items-center border border-border bg-surface-subtle p-0.5 md:flex" aria-label="Mode d'affichage">
            <button type="button" onClick={() => setViewMode("table")} aria-label="Vue tableau" title="Vue tableau" aria-pressed={viewMode === "table"} className={cn("flex size-9 items-center justify-center rounded-sm text-text-muted", viewMode === "table" && "bg-surface text-text shadow-sm")}><List className="size-4" aria-hidden="true" /></button>
            <button type="button" onClick={() => setViewMode("cards")} aria-label="Vue cartes" title="Vue cartes" aria-pressed={viewMode === "cards"} className={cn("flex size-9 items-center justify-center rounded-sm text-text-muted", viewMode === "cards" && "bg-surface text-text shadow-sm")}><Grid2X2 className="size-4" aria-hidden="true" /></button>
          </div>
        </FilterBar></div>
      </div>
      {filteredTables.length === 0 ? <EmptyState title="Aucun résultat" description="Aucune table ne correspond à votre recherche ou à vos filtres." actionLabel="Réinitialiser les filtres" onAction={resetFilters} /> : <>
        {selectedTables.length > 0 ? <div className="flex flex-wrap items-center gap-3 border border-primary/30 bg-primary-subtle p-3"><p className="text-sm font-medium text-text">{selectedTables.length} sélectionnée{selectedTables.length > 1 ? "s" : ""}</p><Button size="sm" variant="danger" onClick={() => setBulkDeleteOpen(true)}>Supprimer la sélection</Button><Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>Désélectionner</Button></div> : null}
        {viewMode === "table" ? <div className="hidden overflow-x-auto md:block"><Surface className="overflow-hidden"><table className="min-w-full text-sm"><thead className="border-b border-border bg-surface-subtle"><tr>{["", "Table", "Occupation", "Statut", "Actions"].map((header) => <th key={header} scope="col" className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">{header || <span className="sr-only">Sélection</span>}</th>)}</tr></thead><tbody className="divide-y divide-border">{paginatedTables.map((table) => <tr key={table.id} className="hover:bg-surface-subtle/60"><td className="px-4 py-3"><input type="checkbox" checked={selectedIds.includes(table.id)} onChange={() => toggleSelected(table.id)} aria-label={`Sélectionner ${table.label}`} className="size-4 accent-primary" /></td><td className="px-4 py-3"><Link href={`/admin/tables/${table.id}`} className="font-medium text-text hover:text-primary-hover">{table.label}</Link></td><td className="min-w-56 px-4 py-3"><Occupancy table={table} /></td><td className="px-4 py-3"><TableStatusBadge status={table.status} /></td><td className="px-4 py-3"><TableRowActions table={table} onEdit={() => setFormTarget(table)} onDelete={() => setDeleteTarget(table)} /></td></tr>)}</tbody></table></Surface></div> : <TableCards tables={paginatedTables} onEdit={setFormTarget} onDelete={setDeleteTarget} />}
        <div className="md:hidden"><MobileList items={paginatedTables.map((table) => ({ id: table.id, title: table.label, subtitle: `${table.assignedCount} / ${table.capacity} places · ${table.availableCount} libres`, badges: <TableStatusBadge status={table.status} />, href: `/admin/tables/${table.id}` }))} /></div>
        <Pagination page={currentPage} totalItems={filteredTables.length} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={handlePageSizeChange} itemLabel="tables" />
      </>}
    </>}
    {deleteTarget && <DeleteTableDialog table={deleteTarget} open onClose={() => setDeleteTarget(null)} />}
    {bulkDeleteOpen ? <BulkDeleteTablesDialog tables={selectedTables} onClose={() => setBulkDeleteOpen(false)} onSuccess={handleBulkDeleted} /> : null}
    <TableDialog open={formTarget !== null} key={formTarget === null ? "closed" : formTarget === "create" ? "create" : `edit-${formTarget.id}`} mode={formTarget === "create" ? "create" : "edit"} table={formTarget && formTarget !== "create" ? formTarget : undefined} onClose={closeForm} onSuccess={handleFormSuccess} />
  </div>;
}

function Occupancy({ table }: { table: TableWithStats }) {
  const fill = Math.min(100, (table.assignedCount / table.capacity) * 100);
  return <><div className="flex items-baseline justify-between gap-3"><span className="font-medium tabular-nums text-text">{table.assignedCount} / {table.capacity} places</span><span className="text-xs tabular-nums text-text-muted">{table.availableCount} libres</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-subtle" aria-label={`${table.assignedCount} places attribuées sur ${table.capacity}`}><div className={cn("h-full rounded-full", table.status === "FULL" ? "bg-warning" : "bg-primary")} style={{ width: `${fill}%` }} /></div></>;
}

function TableCards({ tables, onEdit, onDelete }: { tables: TableWithStats[]; onEdit: (table: TableWithStats) => void; onDelete: (table: TableWithStats) => void }) {
  return <div className="hidden grid-cols-1 gap-3 md:grid lg:grid-cols-2 xl:grid-cols-3">{tables.map((table) => <Surface key={table.id} className="p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><Link href={`/admin/tables/${table.id}`} className="block truncate font-semibold text-text hover:text-primary-hover">{table.label}</Link><p className="mt-1 text-sm text-text-muted">{table.availableCount} place{table.availableCount > 1 ? "s" : ""} libre{table.availableCount > 1 ? "s" : ""}</p></div><TableStatusBadge status={table.status} /></div><div className="mt-5"><Occupancy table={table} /></div><div className="mt-4 border-t border-border pt-3"><TableRowActions table={table} onEdit={() => onEdit(table)} onDelete={() => onDelete(table)} /></div></Surface>)}</div>;
}

function TableRowActions({ table, onEdit, onDelete }: { table: TableWithStats; onEdit: () => void; onDelete: () => void }) {
  const canDelete = table.assignedCount === 0;
  return <div className="flex items-center justify-start gap-1"><Link href={`/admin/tables/${table.id}`} className="inline-flex size-9 items-center justify-center rounded-sm text-text-muted hover:bg-surface-subtle hover:text-text" aria-label={`Voir ${table.label}`} title="Voir le détail"><Eye className="size-4" aria-hidden="true" /></Link><button type="button" onClick={onEdit} className="inline-flex size-9 items-center justify-center rounded-sm text-text-muted hover:bg-surface-subtle hover:text-text" aria-label={`Modifier ${table.label}`} title="Modifier"><Pencil className="size-4" aria-hidden="true" /></button><details className="group relative"><summary className="flex size-9 cursor-pointer list-none items-center justify-center rounded-sm text-text-muted hover:bg-surface-subtle hover:text-text" aria-label={`Plus d’actions pour ${table.label}`} title="Plus d’actions"><MoreHorizontal className="size-4" aria-hidden="true" /></summary><div className="absolute right-0 top-10 z-20 w-52 border border-border bg-surface p-1 shadow-overlay">{canDelete ? <button type="button" onClick={onDelete} className="flex min-h-10 w-full items-center gap-2 px-3 text-left text-sm text-danger hover:bg-danger-subtle"><Trash2 className="size-4" aria-hidden="true" /> Supprimer la table</button> : <p className="px-3 py-2 text-xs leading-5 text-text-muted">Suppression impossible : des invités y sont attribués.</p>}</div></details></div>;
}
