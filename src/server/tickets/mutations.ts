import {
  AuditAction,
  GuestStatus,
  Prisma,
  TicketStatus,
  TicketType,
} from "@prisma/client";
import { randomUUID } from "node:crypto";

import { prisma } from "@/lib/prisma";
import { getTicketPdfFilename, seatsForTicketType, toTicketRecord } from "@/lib/tickets";
import type { AuthenticatedEventUser } from "@/types/auth";
import type { TicketRecord } from "@/types/tickets";
import { TicketError } from "@/server/tickets/errors";
import { renderAndStoreTicketPdf } from "@/server/tickets/pdf";
import { buildTicketTokenArtifacts, generateShortCode } from "@/server/tickets/qr";
import { createSignedPdfUrl } from "@/server/tickets/storage";
import type {
  CancelTicketInput,
  CreateCoupleTicketInput,
  CreateSingleTicketInput,
} from "@/server/tickets/validation";
import { getActiveTemplateForEvent } from "@/server/tickets/queries";

const TRANSACTION_OPTIONS = {
  maxWait: 15_000,
  timeout: 30_000,
} as const;

function isTransactionTimeoutError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === "P2028" || error.message.includes("Transaction already closed"))
  );
}

const ticketInclude = {
  diningTable: {
    select: { id: true, label: true, capacity: true },
  },
  ticketGuests: {
    include: {
      guest: {
        select: { id: true, lastName: true, firstNames: true },
      },
    },
  },
} as const;

async function writeAuditLog(
  tx: Prisma.TransactionClient,
  params: {
    eventId: string;
    actorUserId: string;
    action: AuditAction;
    entityId: string;
    beforeData?: Prisma.InputJsonValue | null;
    afterData?: Prisma.InputJsonValue | null;
  },
): Promise<void> {
  await tx.auditLog.create({
    data: {
      eventId: params.eventId,
      actorUserId: params.actorUserId,
      action: params.action,
      entityType: "ticket",
      entityId: params.entityId,
      beforeData: params.beforeData ?? undefined,
      afterData: params.afterData ?? undefined,
    },
  });
}

async function lockTable(
  tx: Prisma.TransactionClient,
  eventId: string,
  tableId: string,
) {
  const rows = await tx.$queryRaw<Array<{ id: string; capacity: number; label: string }>>`
    SELECT id, capacity, label
    FROM dining_tables
    WHERE id = ${tableId}::uuid AND event_id = ${eventId}::uuid
    FOR UPDATE
  `;

  const table = rows[0];
  if (!table) {
    throw new TicketError("NOT_FOUND", "Table introuvable pour cet événement.");
  }

  return table;
}

async function getOccupiedSeatsTx(
  tx: Prisma.TransactionClient,
  eventId: string,
  tableId: string,
): Promise<number> {
  const tickets = await tx.ticket.findMany({
    where: {
      eventId,
      tableId,
      status: { in: [TicketStatus.ACTIVE, TicketStatus.USED] },
    },
    select: { type: true },
  });

  return tickets.reduce((sum, ticket) => sum + seatsForTicketType(ticket.type), 0);
}

async function assertGuestsEligible(
  tx: Prisma.TransactionClient,
  eventId: string,
  guestIds: string[],
): Promise<Array<{ id: string; lastName: string; firstNames: string; status: GuestStatus }>> {
  const guests = await tx.guest.findMany({
    where: {
      eventId,
      id: { in: guestIds },
    },
    select: {
      id: true,
      lastName: true,
      firstNames: true,
      status: true,
    },
  });

  if (guests.length !== guestIds.length) {
    throw new TicketError(
      "GUEST_NOT_ELIGIBLE",
      "Un ou plusieurs invités sont introuvables pour cet événement.",
    );
  }

  for (const guest of guests) {
    if (guest.status !== GuestStatus.ACTIVE) {
      throw new TicketError(
        "GUEST_NOT_ELIGIBLE",
        "Seuls les invités actifs peuvent recevoir un billet.",
      );
    }
  }

  const activeLinks = await tx.ticketGuest.findMany({
    where: {
      guestId: { in: guestIds },
      ticket: {
        eventId,
        status: TicketStatus.ACTIVE,
      },
    },
    select: { guestId: true },
  });

  if (activeLinks.length > 0) {
    throw new TicketError(
      "GUEST_ALREADY_HAS_ACTIVE_TICKET",
      "Un invité sélectionné possède déjà un billet actif.",
    );
  }

  return guests;
}

async function allocateShortCode(
  tx: Prisma.TransactionClient,
  eventId: string,
): Promise<string> {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const shortCode = generateShortCode(6);
    const existing = await tx.ticket.findFirst({
      where: { eventId, shortCode },
      select: { id: true },
    });
    if (!existing) return shortCode;
  }

  throw new TicketError(
    "INVALID_INPUT",
    "Impossible de générer un code billet unique. Réessayez.",
  );
}

async function createTicketCore(
  eventUser: AuthenticatedEventUser,
  params: {
    type: TicketType;
    guestIds: string[];
    tableId: string;
  },
): Promise<{ record: TicketRecord; token: string }> {
  const template = await getActiveTemplateForEvent(eventUser.eventId);
  if (!template) {
    throw new TicketError(
      "NO_ACTIVE_TEMPLATE",
      "Aucun template PDF actif. Configurez un template avant de créer des billets.",
    );
  }

  const requiredSeats = seatsForTicketType(params.type);
  const ticketId = randomUUID();
  const version = 1;
  const { token, tokenHash } = buildTicketTokenArtifacts(ticketId, version);

  try {
    const created = await prisma.$transaction(async (tx) => {
      const table = await lockTable(tx, eventUser.eventId, params.tableId);
      const guests = await assertGuestsEligible(tx, eventUser.eventId, params.guestIds);

      const occupied = await getOccupiedSeatsTx(tx, eventUser.eventId, params.tableId);
      if (occupied + requiredSeats > table.capacity) {
        throw new TicketError(
          "CAPACITY_EXCEEDED",
          `La table « ${table.label} » n'a plus assez de places disponibles (${table.capacity - occupied} libre(s), ${requiredSeats} requise(s)).`,
          { tableId: "Capacité insuffisante pour ce billet." },
        );
      }

      const shortCode = await allocateShortCode(tx, eventUser.eventId);

      const ticket = await tx.ticket.create({
        data: {
          id: ticketId,
          eventId: eventUser.eventId,
          templateId: template.id,
          tableId: params.tableId,
          shortCode,
          type: params.type,
          status: TicketStatus.ACTIVE,
          tokenHash,
          version,
          ticketGuests: {
            create: params.guestIds.map((guestId, index) => ({
              guestId,
              position: index + 1,
            })),
          },
        },
        include: ticketInclude,
      });

      await tx.guest.updateMany({
        where: {
          eventId: eventUser.eventId,
          id: { in: params.guestIds },
        },
        data: { tableId: params.tableId },
      });

      await writeAuditLog(tx, {
        eventId: eventUser.eventId,
        actorUserId: eventUser.id,
        action: AuditAction.TICKET_CREATED,
        entityId: ticket.id,
        afterData: {
          shortCode: ticket.shortCode,
          type: ticket.type,
          tableId: ticket.tableId,
          guestIds: params.guestIds,
          guestNames: guests.map((guest) => `${guest.lastName} ${guest.firstNames}`),
        },
      });

      return ticket;
    }, TRANSACTION_OPTIONS);

    return { record: toTicketRecord(created), token };
  } catch (error) {
    if (error instanceof TicketError) throw error;
    if (isTransactionTimeoutError(error)) {
      throw new TicketError(
        "INVALID_INPUT",
        "La base de données met trop de temps à répondre. Réessayez.",
      );
    }
    throw error;
  }
}

async function attachPdfToTicket(params: {
  eventId: string;
  ticketId: string;
  version: number;
  token: string;
}): Promise<TicketRecord> {
  const ticketTemplate = await prisma.ticket.findFirst({
    where: { id: params.ticketId, eventId: params.eventId },
    select: {
      template: true,
    },
  });
  const template = ticketTemplate?.template;
  if (!template) {
    await prisma.ticket.update({
      where: { id: params.ticketId },
      data: {
        pdfError: "Aucun template PDF actif pour générer le billet.",
      },
    });
    return getTicketRecord(params.eventId, params.ticketId);
  }

  try {
    const stored = await renderAndStoreTicketPdf({
      eventId: params.eventId,
      ticketId: params.ticketId,
      version: params.version,
      token: params.token,
      templateBucket: template.storageBucket,
      templatePath: template.storagePath,
      layout: {
        pageNumber: template.pageNumber,
        qrX: Number(template.qrX),
        qrY: Number(template.qrY),
        qrSize: Number(template.qrSize),
      },
    });

    const updated = await prisma.ticket.update({
      where: { id: params.ticketId },
      data: {
        pdfStorageBucket: stored.bucket,
        pdfStoragePath: stored.path,
        pdfGeneratedAt: new Date(),
        pdfError: null,
      },
      include: ticketInclude,
    });

    return toTicketRecord(updated);
  } catch {
    const updated = await prisma.ticket.update({
      where: { id: params.ticketId },
      data: {
        pdfError:
          "La génération du PDF a échoué. Le billet reste valide : utilisez « Régénérer le PDF ».",
      },
      include: ticketInclude,
    });

    return toTicketRecord(updated);
  }
}

async function getTicketRecord(eventId: string, ticketId: string): Promise<TicketRecord> {
  const ticket = await prisma.ticket.findFirst({
    where: { id: ticketId, eventId },
    include: ticketInclude,
  });

  if (!ticket) {
    throw new TicketError("NOT_FOUND", "Billet introuvable.");
  }

  return toTicketRecord(ticket);
}

export async function createSingleTicketForEvent(
  eventUser: AuthenticatedEventUser,
  input: CreateSingleTicketInput,
): Promise<TicketRecord> {
  const { record, token } = await createTicketCore(eventUser, {
    type: TicketType.SINGLE,
    guestIds: [input.guestId],
    tableId: input.tableId,
  });

  return attachPdfToTicket({
    eventId: eventUser.eventId,
    ticketId: record.id,
    version: record.version,
    token,
  });
}

export async function createCoupleTicketForEvent(
  eventUser: AuthenticatedEventUser,
  input: CreateCoupleTicketInput,
): Promise<TicketRecord> {
  const { record, token } = await createTicketCore(eventUser, {
    type: TicketType.COUPLE,
    guestIds: [input.guestId1, input.guestId2],
    tableId: input.tableId,
  });

  return attachPdfToTicket({
    eventId: eventUser.eventId,
    ticketId: record.id,
    version: record.version,
    token,
  });
}

export async function cancelTicketForEvent(
  eventUser: AuthenticatedEventUser,
  ticketId: string,
  input: CancelTicketInput = { reason: null },
): Promise<TicketRecord> {
  try {
    const cancelled = await prisma.$transaction(async (tx) => {
      const existing = await tx.ticket.findFirst({
        where: { id: ticketId, eventId: eventUser.eventId },
        include: {
          ticketGuests: { select: { guestId: true } },
        },
      });

      if (!existing) {
        throw new TicketError("NOT_FOUND", "Billet introuvable.");
      }

      if (
        existing.status === TicketStatus.CANCELLED ||
        existing.status === TicketStatus.REVOKED
      ) {
        throw new TicketError("ALREADY_CANCELLED", "Ce billet est déjà annulé ou révoqué.");
      }

      const updated = await tx.ticket.update({
        where: { id: ticketId },
        data: {
          status: TicketStatus.CANCELLED,
          revokedAt: new Date(),
          revokedReason: input.reason,
        },
        include: ticketInclude,
      });

      const guestIds = existing.ticketGuests.map((entry) => entry.guestId);

      for (const guestId of guestIds) {
        const stillNeeded = await tx.ticketGuest.findFirst({
          where: {
            guestId,
            ticket: {
              eventId: eventUser.eventId,
              status: { in: [TicketStatus.ACTIVE, TicketStatus.USED] },
            },
          },
          select: { ticketId: true },
        });

        if (!stillNeeded) {
          await tx.guest.updateMany({
            where: { id: guestId, eventId: eventUser.eventId },
            data: { tableId: null },
          });
        }
      }

      await writeAuditLog(tx, {
        eventId: eventUser.eventId,
        actorUserId: eventUser.id,
        action: AuditAction.TICKET_CANCELLED,
        entityId: ticketId,
        beforeData: {
          status: existing.status,
          tableId: existing.tableId,
          type: existing.type,
        },
        afterData: {
          status: TicketStatus.CANCELLED,
          reason: input.reason,
        },
      });

      return updated;
    }, TRANSACTION_OPTIONS);

    return toTicketRecord(cancelled);
  } catch (error) {
    if (error instanceof TicketError) throw error;
    if (isTransactionTimeoutError(error)) {
      throw new TicketError(
        "INVALID_INPUT",
        "La base de données met trop de temps à répondre. Réessayez.",
      );
    }
    throw error;
  }
}

export async function regenerateTicketPdfForEvent(
  eventUser: AuthenticatedEventUser,
  ticketId: string,
): Promise<TicketRecord> {
  const ticket = await prisma.ticket.findFirst({
    where: { id: ticketId, eventId: eventUser.eventId },
    select: {
      id: true,
      version: true,
      status: true,
    },
  });

  if (!ticket) {
    throw new TicketError("NOT_FOUND", "Billet introuvable.");
  }

  if (
    ticket.status === TicketStatus.CANCELLED ||
    ticket.status === TicketStatus.REVOKED
  ) {
    throw new TicketError(
      "ALREADY_CANCELLED",
      "Impossible de régénérer le PDF d'un billet annulé ou révoqué.",
    );
  }

  const { token } = buildTicketTokenArtifacts(ticket.id, ticket.version);
  const record = await attachPdfToTicket({
    eventId: eventUser.eventId,
    ticketId: ticket.id,
    version: ticket.version,
    token,
  });

  if (!record.pdfAvailable) {
    throw new TicketError(
      "PDF_FAILED",
      record.pdfError ?? "La régénération du PDF a échoué.",
    );
  }

  return record;
}

export async function bulkCancelTicketsForEvent(
  eventUser: AuthenticatedEventUser,
  ticketIds: string[],
): Promise<TicketRecord[]> {
  const ids = [...new Set(ticketIds)].slice(0, 100);
  if (ids.length === 0) throw new TicketError("INVALID_INPUT", "Sélectionnez au moins un billet.");

  const tickets = await prisma.ticket.findMany({
    where: { eventId: eventUser.eventId, id: { in: ids } },
    include: ticketInclude,
  });
  if (tickets.length !== ids.length) throw new TicketError("NOT_FOUND", "Un ou plusieurs billets sont introuvables.");
  if (tickets.some((ticket) => ticket.status !== TicketStatus.ACTIVE && ticket.status !== TicketStatus.USED)) {
    throw new TicketError("ALREADY_CANCELLED", "La sélection contient un billet qui ne peut plus être annulé.");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const records = [];
    const guestIds = new Set<string>();
    for (const ticket of tickets) {
      for (const entry of ticket.ticketGuests) guestIds.add(entry.guestId);
      const next = await tx.ticket.update({
        where: { id: ticket.id },
        data: { status: TicketStatus.CANCELLED, revokedAt: new Date(), revokedReason: null },
        include: ticketInclude,
      });
      await writeAuditLog(tx, {
        eventId: eventUser.eventId,
        actorUserId: eventUser.id,
        action: AuditAction.TICKET_CANCELLED,
        entityId: ticket.id,
        beforeData: { status: ticket.status, tableId: ticket.tableId, type: ticket.type },
        afterData: { status: TicketStatus.CANCELLED, bulk: true },
      });
      records.push(next);
    }
    const activeLinks = await tx.ticketGuest.findMany({
      where: { guestId: { in: [...guestIds] }, ticket: { eventId: eventUser.eventId, status: { in: [TicketStatus.ACTIVE, TicketStatus.USED] } } },
      select: { guestId: true },
    });
    const stillAssigned = new Set(activeLinks.map((entry) => entry.guestId));
    const toRelease = [...guestIds].filter((id) => !stillAssigned.has(id));
    if (toRelease.length > 0) {
      await tx.guest.updateMany({ where: { eventId: eventUser.eventId, id: { in: toRelease } }, data: { tableId: null } });
    }
    return records;
  }, TRANSACTION_OPTIONS);
  return updated.map(toTicketRecord);
}

export async function bulkRegenerateTicketPdfsForEvent(
  eventUser: AuthenticatedEventUser,
  ticketIds: string[],
): Promise<TicketRecord[]> {
  const ids = [...new Set(ticketIds)].slice(0, 20);
  if (ids.length === 0) throw new TicketError("INVALID_INPUT", "Sélectionnez au moins un billet.");
  const tickets = await prisma.ticket.findMany({ where: { eventId: eventUser.eventId, id: { in: ids } }, select: { id: true, status: true } });
  if (tickets.length !== ids.length) throw new TicketError("NOT_FOUND", "Un ou plusieurs billets sont introuvables.");
  if (tickets.some((ticket) => ticket.status !== TicketStatus.ACTIVE && ticket.status !== TicketStatus.USED)) {
    throw new TicketError("ALREADY_CANCELLED", "Seuls les billets actifs ou utilisés peuvent être régénérés.");
  }
  const results: TicketRecord[] = [];
  for (const ticket of tickets) results.push(await regenerateTicketPdfForEvent(eventUser, ticket.id));
  return results;
}

export async function getTicketDownloadUrlForEvent(
  eventUser: AuthenticatedEventUser,
  ticketId: string,
): Promise<{ url: string; filename: string }> {
  const ticket = await prisma.ticket.findFirst({
    where: { id: ticketId, eventId: eventUser.eventId },
    select: {
      shortCode: true,
      pdfStorageBucket: true,
      pdfStoragePath: true,
      pdfGeneratedAt: true,
      pdfError: true,
      ticketGuests: {
        orderBy: { position: "asc" },
        include: { guest: { select: { lastName: true, firstNames: true } } },
      },
    },
  });

  if (!ticket) {
    throw new TicketError("NOT_FOUND", "Billet introuvable.");
  }

  if (!ticket.pdfStorageBucket || !ticket.pdfStoragePath || !ticket.pdfGeneratedAt) {
    throw new TicketError(
      "PDF_FAILED",
      ticket.pdfError ?? "Le PDF de ce billet n'est pas encore disponible.",
    );
  }

  const url = await createSignedPdfUrl({
    bucket: ticket.pdfStorageBucket,
    path: ticket.pdfStoragePath,
    expiresInSeconds: 120,
    download: getTicketPdfFilename({
      shortCode: ticket.shortCode,
      guests: ticket.ticketGuests.map((entry) => entry.guest),
    }),
  });

  return {
    url,
    filename: getTicketPdfFilename({
      shortCode: ticket.shortCode,
      guests: ticket.ticketGuests.map((entry) => entry.guest),
    }),
  };
}
