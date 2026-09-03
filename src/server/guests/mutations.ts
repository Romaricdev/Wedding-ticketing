import { AuditAction, GuestStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { toGuestRecord } from "@/lib/guests";
import type { AuthenticatedEventUser } from "@/types/auth";
import type { GuestRecord } from "@/types/guests";
import { GuestError } from "@/server/guests/errors";
import type { GuestCancelInput, GuestCsvValidatedRow, GuestFormInput } from "@/server/guests/validation";

function isTransactionTimeoutError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === "P2028" || error.message.includes("Transaction already closed"))
  );
}

const TRANSACTION_OPTIONS = {
  maxWait: 10_000,
  timeout: 20_000,
} as const;

const IMPORT_TRANSACTION_OPTIONS = {
  maxWait: 15_000,
  timeout: 60_000,
} as const;

type GuestAuditPayload = {
  lastName: string;
  firstNames: string;
  notes: string | null;
  status: GuestStatus;
  reason?: string | null;
};

async function writeAuditLog(
  tx: Prisma.TransactionClient,
  params: {
    eventId: string;
    actorUserId: string;
    action: AuditAction;
    entityId: string;
    beforeData?: GuestAuditPayload | null;
    afterData?: GuestAuditPayload | null;
  },
): Promise<void> {
  await tx.auditLog.create({
    data: {
      eventId: params.eventId,
      actorUserId: params.actorUserId,
      action: params.action,
      entityType: "guest",
      entityId: params.entityId,
      beforeData: params.beforeData ?? undefined,
      afterData: params.afterData ?? undefined,
    },
  });
}

function guestAuditSnapshot(
  guest: {
    lastName: string;
    firstNames: string;
    notes: string | null;
    status: GuestStatus;
  },
  reason?: string | null,
): GuestAuditPayload {
  return {
    lastName: guest.lastName,
    firstNames: guest.firstNames,
    notes: guest.notes,
    status: guest.status,
    ...(reason ? { reason } : {}),
  };
}

export async function createGuestForEvent(
  eventUser: AuthenticatedEventUser,
  input: GuestFormInput,
): Promise<GuestRecord> {
  try {
    const guest = await prisma.$transaction(async (tx) => {
      const created = await tx.guest.create({
        data: {
          eventId: eventUser.eventId,
          lastName: input.lastName,
          firstNames: input.firstNames,
          notes: input.notes,
          status: GuestStatus.ACTIVE,
        },
      });

      await writeAuditLog(tx, {
        eventId: eventUser.eventId,
        actorUserId: eventUser.id,
        action: AuditAction.GUEST_CREATED,
        entityId: created.id,
        afterData: guestAuditSnapshot(created),
      });

      return created;
    }, TRANSACTION_OPTIONS);

    return toGuestRecord(guest);
  } catch (error) {
    if (isTransactionTimeoutError(error)) {
      throw new GuestError(
        "INVALID_INPUT",
        "La base de données met trop de temps à répondre. Réessayez dans quelques secondes.",
      );
    }

    throw error;
  }
}

export async function updateGuestForEvent(
  eventUser: AuthenticatedEventUser,
  guestId: string,
  input: GuestFormInput,
): Promise<GuestRecord> {
  const existing = await prisma.guest.findFirst({
    where: { id: guestId, eventId: eventUser.eventId },
  });

  if (!existing) {
    throw new GuestError("NOT_FOUND", "Invité introuvable.");
  }

  if (existing.status !== GuestStatus.ACTIVE) {
    throw new GuestError(
      "ALREADY_CANCELLED",
      "Cet invité est annulé. Ses informations ne peuvent plus être modifiées.",
    );
  }

  try {
    const guest = await prisma.$transaction(async (tx) => {
      const updated = await tx.guest.update({
        where: { id: guestId },
        data: {
          lastName: input.lastName,
          firstNames: input.firstNames,
          notes: input.notes,
        },
      });

      await writeAuditLog(tx, {
        eventId: eventUser.eventId,
        actorUserId: eventUser.id,
        action: AuditAction.GUEST_UPDATED,
        entityId: updated.id,
        beforeData: guestAuditSnapshot(existing),
        afterData: guestAuditSnapshot(updated),
      });

      return updated;
    }, TRANSACTION_OPTIONS);

    return toGuestRecord(guest);
  } catch (error) {
    if (error instanceof GuestError) {
      throw error;
    }

    if (isTransactionTimeoutError(error)) {
      throw new GuestError(
        "INVALID_INPUT",
        "La base de données met trop de temps à répondre. Réessayez dans quelques secondes.",
      );
    }

    throw error;
  }
}

export async function cancelGuestForEvent(
  eventUser: AuthenticatedEventUser,
  guestId: string,
  input: GuestCancelInput = { reason: null },
): Promise<GuestRecord> {
  const existing = await prisma.guest.findFirst({
    where: { id: guestId, eventId: eventUser.eventId },
  });

  if (!existing) {
    throw new GuestError("NOT_FOUND", "Invité introuvable.");
  }

  if (existing.status !== GuestStatus.ACTIVE) {
    throw new GuestError("ALREADY_CANCELLED", "Cet invité ne peut plus être annulé.");
  }

  try {
    const guest = await prisma.$transaction(async (tx) => {
      const cancelled = await tx.guest.update({
        where: { id: guestId },
        data: {
          status: GuestStatus.CANCELLED,
        },
      });

      await writeAuditLog(tx, {
        eventId: eventUser.eventId,
        actorUserId: eventUser.id,
        action: AuditAction.GUEST_CANCELLED,
        entityId: cancelled.id,
        beforeData: guestAuditSnapshot(existing),
        afterData: guestAuditSnapshot(cancelled, input.reason),
      });

      return cancelled;
    }, TRANSACTION_OPTIONS);

    return toGuestRecord(guest);
  } catch (error) {
    if (error instanceof GuestError) {
      throw error;
    }

    if (isTransactionTimeoutError(error)) {
      throw new GuestError(
        "INVALID_INPUT",
        "La base de données met trop de temps à répondre. Réessayez dans quelques secondes.",
      );
    }

    throw error;
  }
}

export async function archiveGuestForEvent(
  eventUser: AuthenticatedEventUser,
  guestId: string,
): Promise<GuestRecord> {
  const existing = await prisma.guest.findFirst({
    where: { id: guestId, eventId: eventUser.eventId },
  });
  if (!existing) throw new GuestError("NOT_FOUND", "Invité introuvable.");
  if (existing.status === GuestStatus.ARCHIVED) {
    throw new GuestError("INVALID_INPUT", "Cet invité est déjà archivé.");
  }

  const archived = await prisma.$transaction(async (tx) => {
    const updated = await tx.guest.update({
      where: { id: guestId },
      data: { status: GuestStatus.ARCHIVED },
    });
    await writeAuditLog(tx, {
      eventId: eventUser.eventId,
      actorUserId: eventUser.id,
      action: AuditAction.GUEST_UPDATED,
      entityId: updated.id,
      beforeData: guestAuditSnapshot(existing),
      afterData: guestAuditSnapshot(updated),
    });
    return updated;
  }, TRANSACTION_OPTIONS);

  return toGuestRecord(archived);
}

async function bulkChangeGuestStatusForEvent(
  eventUser: AuthenticatedEventUser,
  guestIds: string[],
  nextStatus: typeof GuestStatus.CANCELLED | typeof GuestStatus.ARCHIVED,
): Promise<GuestRecord[]> {
  const uniqueIds = [...new Set(guestIds)].slice(0, 100);
  if (uniqueIds.length === 0) throw new GuestError("INVALID_INPUT", "Sélectionnez au moins un invité.");
  const guests = await prisma.guest.findMany({ where: { eventId: eventUser.eventId, id: { in: uniqueIds } } });
  if (guests.length !== uniqueIds.length) throw new GuestError("NOT_FOUND", "Un ou plusieurs invités sont introuvables.");
  const eligible = guests.filter((guest) => nextStatus === GuestStatus.CANCELLED ? guest.status === GuestStatus.ACTIVE : guest.status !== GuestStatus.ARCHIVED);
  if (eligible.length !== guests.length) throw new GuestError("INVALID_INPUT", "La sélection contient des invités incompatibles avec cette action.");
  const updated = await prisma.$transaction(async (tx) => Promise.all(eligible.map(async (guest) => {
    const next = await tx.guest.update({ where: { id: guest.id }, data: { status: nextStatus } });
    await writeAuditLog(tx, { eventId: eventUser.eventId, actorUserId: eventUser.id, action: nextStatus === GuestStatus.CANCELLED ? AuditAction.GUEST_CANCELLED : AuditAction.GUEST_UPDATED, entityId: next.id, beforeData: guestAuditSnapshot(guest), afterData: guestAuditSnapshot(next) });
    return next;
  })), TRANSACTION_OPTIONS);
  return updated.map(toGuestRecord);
}

export function archiveGuestsForEvent(eventUser: AuthenticatedEventUser, guestIds: string[]) { return bulkChangeGuestStatusForEvent(eventUser, guestIds, GuestStatus.ARCHIVED); }
export function cancelGuestsForEvent(eventUser: AuthenticatedEventUser, guestIds: string[]) { return bulkChangeGuestStatusForEvent(eventUser, guestIds, GuestStatus.CANCELLED); }

export async function importGuestsForEvent(
  eventUser: AuthenticatedEventUser,
  rows: GuestCsvValidatedRow[],
): Promise<GuestRecord[]> {
  if (rows.length === 0) {
    throw new GuestError("IMPORT_INVALID", "Aucune ligne valide à importer.");
  }

  try {
    const guests = await prisma.$transaction(async (tx) => {
      const createdGuests = [];

      for (const row of rows) {
        const created = await tx.guest.create({
          data: {
            eventId: eventUser.eventId,
            lastName: row.lastName,
            firstNames: row.firstNames,
            notes: row.notes,
            status: GuestStatus.ACTIVE,
          },
        });

        await writeAuditLog(tx, {
          eventId: eventUser.eventId,
          actorUserId: eventUser.id,
          action: AuditAction.GUEST_CREATED,
          entityId: created.id,
          afterData: guestAuditSnapshot(created),
        });

        createdGuests.push(created);
      }

      return createdGuests;
    }, IMPORT_TRANSACTION_OPTIONS);

    return guests.map(toGuestRecord);
  } catch (error) {
    if (isTransactionTimeoutError(error)) {
      throw new GuestError(
        "IMPORT_INVALID",
        "L'import a pris trop de temps. Réduisez la taille du fichier ou réessayez.",
      );
    }

    throw error;
  }
}
