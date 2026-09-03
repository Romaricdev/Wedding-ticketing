import { ScanClient } from "@/components/control/scan-client";
import { requireControllerOrAdmin } from "@/server/auth";
import { listCheckInAttemptsForEvent } from "@/server/check-in/queries";
import { isAdmin } from "@/types/auth";

export default async function ScanPage() {
  const eventUser = await requireControllerOrAdmin();
  const initialAttempts = await listCheckInAttemptsForEvent(eventUser.eventId).catch(() => []);
  return <ScanClient canManual={isAdmin(eventUser)} initialAttempts={initialAttempts} />;
}
