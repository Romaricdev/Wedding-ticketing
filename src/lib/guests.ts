import type { Guest } from "@prisma/client";
import { GuestStatus } from "@prisma/client";

import {
  GUEST_STATUS_LABELS,
  type GuestListStatus,
  type GuestRecord,
} from "@/types/guests";

type GuestEntity = Pick<
  Guest,
  "id" | "lastName" | "firstNames" | "notes" | "status" | "createdAt" | "updatedAt"
>;

export function toGuestRecord(guest: GuestEntity): GuestRecord {
  return {
    id: guest.id,
    lastName: guest.lastName,
    firstNames: guest.firstNames,
    notes: guest.notes,
    status: guest.status,
    createdAt: guest.createdAt.toISOString(),
    updatedAt: guest.updatedAt.toISOString(),
  };
}

export function formatGuestFullName(lastName: string, firstNames: string): string {
  return `${lastName.trim().toUpperCase()} ${firstNames.trim()}`.trim();
}

export function getGuestStatusLabel(status: GuestStatus): string {
  if (status === GuestStatus.ACTIVE || status === GuestStatus.CANCELLED || status === GuestStatus.ARCHIVED) {
    return GUEST_STATUS_LABELS[status as GuestListStatus];
  }

  return "Archivé";
}

export function isGuestCancelled(status: GuestStatus): boolean {
  return status === GuestStatus.CANCELLED;
}

export function guestIdentityKey(lastName: string, firstNames: string): string {
  return `${lastName.trim().toLocaleLowerCase("fr")}::${firstNames.trim().toLocaleLowerCase("fr")}`;
}

export function truncateNotes(notes: string | null | undefined, maxLength = 48): string {
  const value = notes?.trim() ?? "";
  if (!value) return "";
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1)}…`;
}
