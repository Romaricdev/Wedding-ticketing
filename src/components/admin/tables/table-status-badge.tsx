import { TABLE_STATUS_LABELS, type TableCapacityStatus } from "@/types/tables";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const VARIANTS: Record<TableCapacityStatus, "neutral" | "warning"> = {
  AVAILABLE: "neutral",
  FULL: "warning",
};

export interface TableStatusBadgeProps {
  status: TableCapacityStatus;
  className?: string;
}

export function TableStatusBadge({ status, className }: TableStatusBadgeProps) {
  return (
    <Badge variant={VARIANTS[status]} className={cn("text-xs", className)}>
      {TABLE_STATUS_LABELS[status]}
    </Badge>
  );
}
