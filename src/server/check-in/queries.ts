import { prisma } from "@/lib/prisma";
import type { CheckInAttemptRecord } from "@/types/check-in";

export async function listCheckInAttemptsForEvent(eventId: string, take?: number): Promise<CheckInAttemptRecord[]> {
  const attempts = await prisma.checkInAttempt.findMany({
    where: { eventId },
    orderBy: { scannedAt: "desc" },
    ...(take ? { take } : {}),
    include: {
      operator: { select: { displayName: true } },
      ticket: {
        include: {
          diningTable: { select: { label: true } },
          ticketGuests: { orderBy: { position: "asc" }, include: { guest: { select: { lastName: true, firstNames: true } } } },
        },
      },
    },
  });
  return attempts.map((attempt) => ({
    id: attempt.id,
    result: attempt.result,
    isManual: attempt.isManual,
    scannedAt: attempt.scannedAt.toISOString(),
    operatorName: attempt.operator?.displayName ?? null,
    ticket: attempt.ticket ? {
      id: attempt.ticket.id,
      shortCode: attempt.ticket.shortCode,
      type: attempt.ticket.type,
      status: attempt.ticket.status,
      tableLabel: attempt.ticket.diningTable.label,
      guests: attempt.ticket.ticketGuests.map((entry) => entry.guest),
    } : null,
  }));
}
