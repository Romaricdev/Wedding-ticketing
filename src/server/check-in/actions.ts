"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin, requireControllerOrAdmin } from "@/server/auth";
import { checkInFromQr, lookupTicketForManualCheckIn, manualCheckIn } from "@/server/check-in/mutations";
import { listCheckInAttemptsForEvent } from "@/server/check-in/queries";
import type { CheckInAttemptRecord, CheckInResponse, CheckInTicketSummary } from "@/types/check-in";

function errorResponse(): CheckInResponse { return { result: "DENIED", title: "Serveur indisponible", message: "Le serveur ne peut pas répondre. Vérifiez votre connexion puis réessayez.", ticket: null, accepted: false, isManual: false }; }
function refresh() { revalidatePath("/admin"); revalidatePath("/admin/historique"); revalidatePath("/admin/billets"); }

export async function scanTicketAction(rawToken: string, deviceLabel?: string): Promise<CheckInResponse> {
  try { const operator = await requireControllerOrAdmin(); const result = await checkInFromQr(operator, rawToken, deviceLabel); refresh(); return result; } catch { return errorResponse(); }
}

export async function findTicketForManualCheckInAction(shortCode: string): Promise<{ ticket: CheckInTicketSummary | null; error?: string }> {
  try { const admin = await requireAdmin(); return { ticket: await lookupTicketForManualCheckIn(admin, shortCode) }; } catch { return { ticket: null, error: "Recherche indisponible." }; }
}

export async function manualCheckInAction(ticketId: string, reason?: string): Promise<CheckInResponse> {
  try { const admin = await requireAdmin(); const result = await manualCheckIn(admin, ticketId, reason); refresh(); return result; } catch { return errorResponse(); }
}

export async function listCheckInAttemptsAction(): Promise<{ attempts?: CheckInAttemptRecord[]; error?: string }> {
  try { const operator = await requireControllerOrAdmin(); return { attempts: await listCheckInAttemptsForEvent(operator.eventId) }; } catch { return { error: "Historique indisponible." }; }
}
