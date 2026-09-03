export type TableCapacityStatus = "AVAILABLE" | "FULL";

export interface TableWithStats {
  id: string;
  label: string;
  capacity: number;
  assignedCount: number;
  availableCount: number;
  status: TableCapacityStatus;
  createdAt: string;
  updatedAt: string;
}

export const TABLE_STATUS_LABELS: Record<TableCapacityStatus, string> = {
  AVAILABLE: "Disponible",
  FULL: "Complète",
};
