"use client";

import { TicketStatus, TicketType } from "@prisma/client";

import { StatusBadge } from "@/components/ui/status-badge";
import { getTicketStatusLabel, getTicketTypeLabel } from "@/lib/tickets";

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  const map = {
    [TicketStatus.ACTIVE]: "active",
    [TicketStatus.USED]: "used",
    [TicketStatus.REVOKED]: "revoked",
    [TicketStatus.CANCELLED]: "cancelled",
  } as const;

  return <StatusBadge status={map[status]} label={getTicketStatusLabel(status)} />;
}

export function TicketTypeBadge({ type }: { type: TicketType }) {
  return (
    <StatusBadge
      status={type === TicketType.COUPLE ? "couple" : "single"}
      label={getTicketTypeLabel(type)}
    />
  );
}
