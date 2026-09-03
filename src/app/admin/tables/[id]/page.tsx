import { Suspense } from "react";
import { notFound } from "next/navigation";

import { TableDetailView } from "@/components/admin/tables/table-detail-view";
import { LoadingState } from "@/components/ui/loading-state";
import { getTableForEvent } from "@/server/tables/queries";
import { TableError } from "@/server/tables/errors";
import { requireAdmin } from "@/server/auth";

interface TableDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
}

export default async function TableDetailPage({ params, searchParams }: TableDetailPageProps) {
  const eventUser = await requireAdmin();
  const { id } = await params;
  const query = await searchParams;

  let table: Awaited<ReturnType<typeof getTableForEvent>>;

  try {
    table = await getTableForEvent(eventUser.eventId, id);
  } catch (error) {
    if (error instanceof TableError && error.code === "NOT_FOUND") {
      notFound();
    }

    throw error;
  }

  return (
    <Suspense fallback={<LoadingState label="Chargement de la table…" />}>
      <TableDetailView
        key={`${table.id}-${query.edit === "1" ? "edit" : "view"}`}
        table={table}
        initialEditMode={query.edit === "1"}
      />
    </Suspense>
  );
}
