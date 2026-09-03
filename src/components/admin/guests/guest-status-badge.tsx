"use client";

import { GuestStatus } from "@prisma/client";

import { StatusBadge } from "@/components/ui/status-badge";
import { getGuestStatusLabel } from "@/lib/guests";

export function GuestStatusBadge({ status }: { status: GuestStatus }) {
  if (status === GuestStatus.CANCELLED) {
    return <StatusBadge status="cancelled" label={getGuestStatusLabel(status)} />;
  }

  if (status === GuestStatus.ACTIVE) {
    return <StatusBadge status="active" label={getGuestStatusLabel(status)} />;
  }

  return <StatusBadge status="info" label={getGuestStatusLabel(status)} />;
}
