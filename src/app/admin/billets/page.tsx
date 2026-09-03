import { TicketsPageClient } from "@/components/admin/tickets/tickets-page-client";
import { listTicketsForEvent } from "@/server/tickets/queries";
import { requireAdmin } from "@/server/auth";

export default async function AdminBilletsPage() {
  const eventUser = await requireAdmin();
  let tickets = [] as Awaited<ReturnType<typeof listTicketsForEvent>>;
  let loadError: string | undefined;

  try {
    tickets = await listTicketsForEvent(eventUser.eventId);
  } catch {
    loadError = "Impossible de charger les billets pour le moment.";
  }

  return <TicketsPageClient tickets={tickets} loadError={loadError} />;
}
