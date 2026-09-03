import { GuestStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { toTableWithStats } from "@/lib/tables";
import { TableError } from "@/server/tables/errors";
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
