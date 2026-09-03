import { GuestStatus } from "@prisma/client";

export type GuestListStatus = Extract<GuestStatus, "ACTIVE" | "CANCELLED" | "ARCHIVED">;

export interface GuestRecord {
  id: string;
  lastName: string;
  firstNames: string;
  notes: string | null;
  status: GuestStatus;
  createdAt: string;
  updatedAt: string;
}

export const GUEST_STATUS_LABELS: Record<GuestListStatus, string> = {
  ACTIVE: "Actif",
  CANCELLED: "Annulé",
  ARCHIVED: "Archivé",
};
