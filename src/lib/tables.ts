import type { DiningTable } from "@prisma/client";

import {
  TABLE_STATUS_LABELS,
  type TableCapacityStatus,
  type TableWithStats,
} from "@/types/tables";

type TableRecord = Pick<
  DiningTable,
  "id" | "label" | "capacity" | "createdAt" | "updatedAt"
>;

export function computeTableStats(
  capacity: number,
  assignedCount: number,
): Pick<TableWithStats, "assignedCount" | "availableCount" | "status"> {
  const safeAssigned = Math.max(0, assignedCount);
  const availableCount = Math.max(0, capacity - safeAssigned);
  const status: TableCapacityStatus =
    safeAssigned >= capacity ? "FULL" : "AVAILABLE";

  return {
    assignedCount: safeAssigned,
    availableCount,
    status,
  };
}

export function getTableStatusLabel(status: TableCapacityStatus): string {
  return TABLE_STATUS_LABELS[status];
}

export function formatTableOccupancy(assignedCount: number, capacity: number): string {
  return `${assignedCount} / ${capacity}`;
}

export function toTableWithStats(
  table: TableRecord,
  assignedCount = 0,
): TableWithStats {
  return {
    id: table.id,
    label: table.label,
    capacity: table.capacity,
    ...computeTableStats(table.capacity, assignedCount),
    createdAt: table.createdAt.toISOString(),
    updatedAt: table.updatedAt.toISOString(),
  };
}
