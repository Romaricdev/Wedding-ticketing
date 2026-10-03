import { GuestStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { toGuestRecord } from "@/lib/guests";
import { toTableWithStats } from "@/lib/tables";
import { TableError } from "@/server/tables/errors";
import type { GuestRecord } from "@/types/guests";
import type { TableWithStats } from "@/types/tables";

export async function listTablesForEvent(eventId: string): Promise<TableWithStats[]> {
  const tables = await prisma.diningTable.findMany({
    where: { eventId },
    orderBy: { label: "asc" },
    include: {
      _count: {
        select: {
          guests: {
            where: { status: GuestStatus.ACTIVE },
          },
        },
      },
    },
  });

  return tables.map((table) =>
    toTableWithStats(table, table._count.guests),
  );
}

export async function getTableForEvent(
  eventId: string,
  tableId: string,
): Promise<TableWithStats> {
  const table = await prisma.diningTable.findFirst({
    where: { id: tableId, eventId },
    include: {
      _count: {
        select: {
          guests: {
            where: { status: GuestStatus.ACTIVE },
          },
        },
      },
    },
  });

  if (!table) {
    throw new TableError("NOT_FOUND", "Table introuvable.");
  }

  return toTableWithStats(table, table._count.guests);
}

export async function getAssignedCountForTable(
  eventId: string,
  tableId: string,
): Promise<number> {
  return prisma.guest.count({
    where: {
      eventId,
      tableId,
      status: GuestStatus.ACTIVE,
    },
  });
}

export async function listActiveGuestsForTableForEvent(
  eventId: string,
  tableId: string,
): Promise<GuestRecord[]> {
  const table = await prisma.diningTable.findFirst({
    where: { id: tableId, eventId },
    select: { id: true },
  });

  if (!table) {
    throw new TableError("NOT_FOUND", "Table introuvable.");
  }

  const guests = await prisma.guest.findMany({
    where: {
      eventId,
      tableId,
      status: GuestStatus.ACTIVE,
    },
    orderBy: [{ lastName: "asc" }, { firstNames: "asc" }],
    select: {
      id: true,
      lastName: true,
      firstNames: true,
      notes: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return guests.map(toGuestRecord);
}
