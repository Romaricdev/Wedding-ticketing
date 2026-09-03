import { Suspense } from "react";

import { TablesPageClient } from "@/components/admin/tables/tables-page-client";
import { LoadingState } from "@/components/ui/loading-state";
import { listTablesForEvent } from "@/server/tables/queries";
import { requireAdmin } from "@/server/auth";

export default async function AdminTablesPage() {
  const eventUser = await requireAdmin();
  let tables = [] as Awaited<ReturnType<typeof listTablesForEvent>>;
  let loadError: string | undefined;

  try {
    tables = await listTablesForEvent(eventUser.eventId);
  } catch {
    loadError = "Impossible de charger les tables pour le moment.";
  }

  return (
    <Suspense fallback={<LoadingState label="Chargement des tables…" />}>
      <TablesPageClient tables={tables} loadError={loadError} />
    </Suspense>
  );
}
