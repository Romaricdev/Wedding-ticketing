import { AuditAction, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { toTableWithStats } from "@/lib/tables";
import type { AuthenticatedEventUser } from "@/types/auth";
import type { TableWithStats } from "@/types/tables";
import { getAssignedCountForTable } from "@/server/tables/queries";
import { TableError } from "@/server/tables/errors";
import type { TableFormInput } from "@/server/tables/validation";

function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
  );
}

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

async function assertLabelAvailable(
  eventId: string,
  label: string,
  excludeTableId?: string,
  tx: Prisma.TransactionClient | typeof prisma = prisma,
): Promise<void> {
  const existing = await tx.diningTable.findFirst({
    where: {
      eventId,
      label,
      ...(excludeTableId ? { NOT: { id: excludeTableId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    throw new TableError(
      "DUPLICATE_LABEL",
      "Une table avec ce nom ou numéro existe déjà pour cet événement.",
      { label: "Ce nom ou numéro est déjà utilisé." },
    );
  }
}

async function writeAuditLog(
  tx: Prisma.TransactionClient,
  params: {
    eventId: string;
    actorUserId: string;
    action: AuditAction;
    entityId: string;
    beforeData?: { label: string; capacity: number } | null;
    afterData?: { label: string; capacity: number } | null;
  },
): Promise<void> {
  await tx.auditLog.create({
    data: {
      eventId: params.eventId,
      actorUserId: params.actorUserId,
      action: params.action,
      entityType: "table",
      entityId: params.entityId,
      beforeData: params.beforeData ?? undefined,
      afterData: params.afterData ?? undefined,
    },
  });
}

export async function createTableForEvent(
  eventUser: AuthenticatedEventUser,
  input: TableFormInput,
): Promise<TableWithStats> {
  try {
    const table = await prisma.$transaction(async (tx) => {
      const created = await tx.diningTable.create({
        data: {
          eventId: eventUser.eventId,
          label: input.label,
          capacity: input.capacity,
        },
      });

      await writeAuditLog(tx, {
        eventId: eventUser.eventId,
        actorUserId: eventUser.id,
        action: AuditAction.TABLE_CREATED,
        entityId: created.id,
        afterData: {
          label: created.label,
          capacity: created.capacity,
        },
      });

      return created;
    }, TRANSACTION_OPTIONS);

    return toTableWithStats(table, 0);
  } catch (error) {
    if (error instanceof TableError) {
      throw error;
    }

    if (isUniqueConstraintError(error)) {
      throw new TableError(
        "DUPLICATE_LABEL",
        "Une table avec ce nom ou numéro existe déjà pour cet événement.",
        { label: "Ce nom ou numéro est déjà utilisé." },
      );
    }

    if (isTransactionTimeoutError(error)) {
      throw new TableError(
        "INVALID_INPUT",
        "La base de données met trop de temps à répondre. Réessayez dans quelques secondes.",
      );
    }

    throw error;
  }
}

export async function updateTableForEvent(
  eventUser: AuthenticatedEventUser,
  tableId: string,
  input: TableFormInput,
): Promise<TableWithStats> {
  const existing = await prisma.diningTable.findFirst({
    where: { id: tableId, eventId: eventUser.eventId },
  });

  if (!existing) {
    throw new TableError("NOT_FOUND", "Table introuvable.");
  }

  const assignedCount = await getAssignedCountForTable(eventUser.eventId, tableId);

  if (input.capacity < assignedCount) {
    throw new TableError(
      "CAPACITY_TOO_LOW",
      `La capacité ne peut pas être inférieure aux ${assignedCount} place(s) déjà attribuée(s).`,
      {
        capacity: `Minimum requis : ${assignedCount} place(s).`,
      },
    );
  }

  try {
    const table = await prisma.$transaction(async (tx) => {
      await assertLabelAvailable(eventUser.eventId, input.label, tableId, tx);

      const updated = await tx.diningTable.update({
        where: { id: tableId },
        data: {
          label: input.label,
          capacity: input.capacity,
        },
      });

      await writeAuditLog(tx, {
        eventId: eventUser.eventId,
        actorUserId: eventUser.id,
        action: AuditAction.TABLE_UPDATED,
        entityId: updated.id,
        beforeData: {
          label: existing.label,
          capacity: existing.capacity,
        },
        afterData: {
          label: updated.label,
          capacity: updated.capacity,
        },
      });

      return updated;
    }, TRANSACTION_OPTIONS);

    return toTableWithStats(table, assignedCount);
  } catch (error) {
    if (error instanceof TableError) {
      throw error;
    }

    if (isUniqueConstraintError(error)) {
      throw new TableError(
        "DUPLICATE_LABEL",
        "Une table avec ce nom ou numéro existe déjà pour cet événement.",
        { label: "Ce nom ou numéro est déjà utilisé." },
      );
    }

    if (isTransactionTimeoutError(error)) {
      throw new TableError(
        "INVALID_INPUT",
        "La base de données met trop de temps à répondre. Réessayez dans quelques secondes.",
      );
    }

    throw error;
  }
}

export async function deleteTableForEvent(
  eventUser: AuthenticatedEventUser,
  tableId: string,
): Promise<void> {
  const existing = await prisma.diningTable.findFirst({
    where: { id: tableId, eventId: eventUser.eventId },
  });

  if (!existing) {
    throw new TableError("NOT_FOUND", "Table introuvable.");
  }

  const assignedCount = await getAssignedCountForTable(eventUser.eventId, tableId);

  if (assignedCount > 0) {
    throw new TableError(
      "TABLE_NOT_EMPTY",
      "Cette table ne peut pas être supprimée car des invités actifs y sont associés.",
    );
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.diningTable.delete({
        where: { id: tableId },
      });

      await writeAuditLog(tx, {
        eventId: eventUser.eventId,
        actorUserId: eventUser.id,
        action: AuditAction.TABLE_DELETED,
        entityId: tableId,
        beforeData: {
          label: existing.label,
          capacity: existing.capacity,
        },
        afterData: null,
      });
    }, TRANSACTION_OPTIONS);
  } catch (error) {
    if (isTransactionTimeoutError(error)) {
      throw new TableError(
        "INVALID_INPUT",
        "La base de données met trop de temps à répondre. Réessayez dans quelques secondes.",
      );
    }

    throw error;
  }
}

export async function deleteTablesForEvent(eventUser: AuthenticatedEventUser, tableIds: string[]): Promise<string[]> {
  const ids = [...new Set(tableIds)].slice(0, 100);
  if (ids.length === 0) throw new TableError("INVALID_INPUT", "Sélectionnez au moins une table.");
  const tables = await prisma.diningTable.findMany({ where: { eventId: eventUser.eventId, id: { in: ids } } });
  if (tables.length !== ids.length) throw new TableError("NOT_FOUND", "Une ou plusieurs tables sont introuvables.");
  const assigned = await prisma.guest.count({ where: { eventId: eventUser.eventId, tableId: { in: ids }, status: "ACTIVE" } });
  if (assigned > 0) throw new TableError("TABLE_NOT_EMPTY", "La sélection contient une table avec des invités actifs.");
  await prisma.$transaction(async (tx) => Promise.all(tables.map(async (table) => {
    await tx.diningTable.delete({ where: { id: table.id } });
    await writeAuditLog(tx, { eventId: eventUser.eventId, actorUserId: eventUser.id, action: AuditAction.TABLE_DELETED, entityId: table.id, beforeData: { label: table.label, capacity: table.capacity }, afterData: null });
  })), TRANSACTION_OPTIONS);
  return ids;
}
