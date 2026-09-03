"use client";

import { TicketsListView } from "@/components/admin/tickets/tickets-list-view";
import type { TicketRecord } from "@/types/tickets";

export function TicketsPageClient({
  tickets,
  loadError,
}: {
  tickets: TicketRecord[];
  loadError?: string;
}) {
  return <TicketsListView initialTickets={tickets} loadError={loadError} />;
}
