import { Suspense } from "react";

import { GuestsPageClient } from "@/components/admin/guests/guests-page-client";
import { LoadingState } from "@/components/ui/loading-state";
import { listGuestsForEvent } from "@/server/guests/queries";
import { requireAdmin } from "@/server/auth";

export default async function AdminInvitesPage() {
  const eventUser = await requireAdmin();
  let guests = [] as Awaited<ReturnType<typeof listGuestsForEvent>>;
  let loadError: string | undefined;

  try {
    guests = await listGuestsForEvent(eventUser.eventId);
  } catch {
    loadError = "Impossible de charger les invités pour le moment.";
  }

  return (
    <Suspense fallback={<LoadingState label="Chargement des invités…" />}>
      <GuestsPageClient guests={guests} loadError={loadError} />
    </Suspense>
  );
}
