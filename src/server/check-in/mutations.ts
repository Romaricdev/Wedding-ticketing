import { AuditAction, CheckInResult, EventRole, Prisma, TicketStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { hashTicketToken } from "@/server/tickets/qr";
import type { AuthenticatedEventUser } from "@/types/auth";
import type { CheckInResponse, CheckInTicketSummary } from "@/types/check-in";

const ticketInclude = {
  diningTable: { select: { label: true } },
  ticketGuests: { orderBy: { position: "asc" }, include: { guest: { select: { lastName: true, firstNames: true } } } },
} as const;

function summary(ticket: { id: string; shortCode: string; type: "SINGLE" | "COUPLE"; status: TicketStatus; diningTable: { label: string }; ticketGuests: Array<{ guest: { lastName: string; firstNames: string } }> }): CheckInTicketSummary {
  return { id: ticket.id, shortCode: ticket.shortCode, type: ticket.type, status: ticket.status, tableLabel: ticket.diningTable.label, guests: ticket.ticketGuests.map((entry) => entry.guest) };
}

function response(result: CheckInResult, ticket: CheckInTicketSummary | null, isManual = false): CheckInResponse {
  const copy: Record<CheckInResult, [string, string, boolean]> = {
    ACCEPTED: ["Entrée autorisée", "Le billet est valide. L’entrée vient d’être enregistrée.", true],
    MANUAL_ACCEPTED: ["Entrée validée manuellement", "L’entrée a été enregistrée par un administrateur.", true],
    ALREADY_USED: ["Billet déjà utilisé", "Ce billet a déjà été validé à l’entrée.", false],
    INVALID: ["QR code invalide", "Ce QR code ne correspond à aucun billet de cet événement.", false],
    REVOKED: ["Billet révoqué", "Ce billet n’est plus valable.", false],
    CANCELLED: ["Billet annulé", "Ce billet a été annulé et ne permet pas l’entrée.", false],
    DENIED: ["Entrée refusée", "Ce billet ne peut pas être validé.", false],
  };
  const [title, message, accepted] = copy[result];
  return { result, title, message, ticket, accepted, isManual };
}

async function logAttempt(tx: Prisma.TransactionClient, params: { eventId: string; ticketId?: string; operatorUserId: string; result: CheckInResult; isManual: boolean; manualReason?: string | null; unknownTokenHash?: string | null; deviceLabel?: string | null }) {
  await tx.checkInAttempt.create({ data: { eventId: params.eventId, ticketId: params.ticketId, operatorUserId: params.operatorUserId, result: params.result, isManual: params.isManual, manualReason: params.manualReason ?? null, unknownTokenHash: params.unknownTokenHash ?? null, deviceLabel: params.deviceLabel?.slice(0, 120) ?? null } });
}

async function validateTicket(eventUser: AuthenticatedEventUser, ticketId: string, isManual: boolean, deviceLabel?: string, manualReason?: string | null): Promise<CheckInResponse> {
  return prisma.$transaction(async (tx) => {
    const ticket = await tx.ticket.findFirst({ where: { id: ticketId, eventId: eventUser.eventId }, include: ticketInclude });
    if (!ticket) return response(CheckInResult.INVALID, null, isManual);
    let result: CheckInResult;
    if (ticket.status === TicketStatus.CANCELLED) result = CheckInResult.CANCELLED;
    else if (ticket.status === TicketStatus.REVOKED) result = CheckInResult.REVOKED;
    else if (ticket.status === TicketStatus.USED) result = CheckInResult.ALREADY_USED;
    else {
      const claimed = await tx.ticket.updateMany({ where: { id: ticket.id, eventId: eventUser.eventId, status: TicketStatus.ACTIVE }, data: { status: TicketStatus.USED, checkedInAt: new Date(), checkedInByUserId: eventUser.id } });
      if (claimed.count === 1) {
        result = isManual ? CheckInResult.MANUAL_ACCEPTED : CheckInResult.ACCEPTED;
        await tx.auditLog.create({ data: { eventId: eventUser.eventId, actorUserId: eventUser.id, action: isManual ? AuditAction.CHECK_IN_MANUAL_ACCEPTED : AuditAction.CHECK_IN_ACCEPTED, entityType: "ticket", entityId: ticket.id, afterData: { shortCode: ticket.shortCode, isManual } } });
      } else {
        result = CheckInResult.ALREADY_USED;
      }
    }
    await logAttempt(tx, { eventId: eventUser.eventId, ticketId: ticket.id, operatorUserId: eventUser.id, result, isManual, manualReason, deviceLabel });
    const current = result === CheckInResult.ACCEPTED || result === CheckInResult.MANUAL_ACCEPTED ? { ...ticket, status: TicketStatus.USED } : ticket;
    return response(result, summary(current), isManual);
  }, { maxWait: 15_000, timeout: 30_000 });
}

export async function checkInFromQr(eventUser: AuthenticatedEventUser, rawToken: string, deviceLabel?: string): Promise<CheckInResponse> {
  const token = rawToken.trim();
  const unknownTokenHash = hashTicketToken(token || "empty");
  if (!token.startsWith("v1.") || token.length > 512) {
    await prisma.checkInAttempt.create({ data: { eventId: eventUser.eventId, operatorUserId: eventUser.id, result: CheckInResult.INVALID, unknownTokenHash, deviceLabel: deviceLabel?.slice(0, 120) ?? null } });
    return response(CheckInResult.INVALID, null);
  }
  const ticket = await prisma.ticket.findFirst({ where: { eventId: eventUser.eventId, tokenHash: hashTicketToken(token) }, select: { id: true } });
  if (!ticket) {
    await prisma.checkInAttempt.create({ data: { eventId: eventUser.eventId, operatorUserId: eventUser.id, result: CheckInResult.INVALID, unknownTokenHash, deviceLabel: deviceLabel?.slice(0, 120) ?? null } });
    return response(CheckInResult.INVALID, null);
  }
  return validateTicket(eventUser, ticket.id, false, deviceLabel);
}

export async function lookupTicketForManualCheckIn(eventUser: AuthenticatedEventUser, shortCode: string): Promise<CheckInTicketSummary | null> {
  if (eventUser.role !== EventRole.ADMIN) return null;
  const ticket = await prisma.ticket.findFirst({ where: { eventId: eventUser.eventId, shortCode: shortCode.trim().toUpperCase() }, include: ticketInclude });
  return ticket ? summary(ticket) : null;
}

export async function manualCheckIn(eventUser: AuthenticatedEventUser, ticketId: string, reason?: string): Promise<CheckInResponse> {
  if (eventUser.role !== EventRole.ADMIN) return response(CheckInResult.DENIED, null, true);
  return validateTicket(eventUser, ticketId, true, undefined, reason?.trim().slice(0, 300) || null);
}
