"use client";

import Link from "next/link";
import { useState } from "react";
import { Pencil, Trash2, Users } from "lucide-react";
import { useRouter } from "next/navigation";

import { DeleteTableDialog } from "@/components/admin/tables/delete-table-dialog";
import { TableDialog } from "@/components/admin/tables/table-dialog";
import { TableStatusBadge } from "@/components/admin/tables/table-status-badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Surface } from "@/components/ui/surface";
import type { TableWithStats } from "@/types/tables";

export interface TableDetailViewProps {
  table: TableWithStats;
  initialEditMode?: boolean;
}

export function TableDetailView({ table, initialEditMode = false }: TableDetailViewProps) {
  const router = useRouter();
  const [savedTable, setSavedTable] = useState<TableWithStats | null>(null);
  const [previousTable, setPreviousTable] = useState(table);
  if (table !== previousTable) {
    setPreviousTable(table);
    setSavedTable(null);
  }
  const currentTable = savedTable ?? table;
  const [editOpen, setEditOpen] = useState(initialEditMode);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const canDelete = currentTable.assignedCount === 0;

  const handleUpdated = (nextTable: TableWithStats) => {
    setSavedTable(nextTable);
    router.refresh();
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={currentTable.label}
        description="Capacité, occupation et invités attribués à cette table."
        meta={
          <nav aria-label="Fil d'Ariane détaillé">
            <ol className="flex flex-wrap items-center gap-2 text-sm text-text-muted">
              <li>
                <Link href="/admin/tables" className="text-text-muted hover:text-text">
                  Tables
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="font-medium text-text">{currentTable.label}</li>
            </ol>
          </nav>
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setEditOpen(true)}>
              <Pencil className="size-4" aria-hidden="true" /> Modifier la table
            </Button>
            {canDelete ? (
              <Button variant="danger" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="size-4" aria-hidden="true" /> Supprimer
              </Button>
            ) : null}
          </div>
        }
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTile label="Capacité" value={String(currentTable.capacity)} />
        <MetricTile label="Places attribuées" value={String(currentTable.assignedCount)} />
        <MetricTile label="Places libres" value={String(currentTable.availableCount)} />
        <Surface className="flex items-center justify-between p-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Statut</p>
            <div className="mt-2">
              <TableStatusBadge status={currentTable.status} />
            </div>
          </div>
        </Surface>
      </div>
      <Surface className="space-y-4 p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <Users className="size-4 text-text-muted" aria-hidden="true" />
          <h2 className="text-base font-semibold text-text">Invités attribués</h2>
        </div>
        <EmptyState
          title={
            currentTable.assignedCount === 0
              ? "Aucun invité attribué"
              : "Liste des invités indisponible"
          }
          description={
            currentTable.assignedCount === 0
              ? "Les personnes affectées à cette table apparaîtront ici après la Phase 4."
              : `${currentTable.assignedCount} personne(s) associée(s) à cette table. La liste détaillée apparaîtra en Phase 4.`
          }
        />
      </Surface>
      {deleteOpen ? (
        <DeleteTableDialog table={currentTable} open onClose={() => setDeleteOpen(false)} />
      ) : null}
      <TableDialog
        open={editOpen}
        mode="edit"
        table={currentTable}
        onClose={() => setEditOpen(false)}
        onSuccess={handleUpdated}
      />
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <Surface className="p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-text">{value}</p>
    </Surface>
  );
}
