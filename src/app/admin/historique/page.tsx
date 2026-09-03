import { HistoryPageClient } from "@/components/admin/history/history-page-client";
import { requireAdmin } from "@/server/auth";
import { listCheckInAttemptsForEvent } from "@/server/check-in/queries";

export default async function AdminHistoriquePage() {
  const eventUser = await requireAdmin();
  const attempts = await listCheckInAttemptsForEvent(eventUser.eventId);
  return <HistoryPageClient initialAttempts={attempts} />;
}
