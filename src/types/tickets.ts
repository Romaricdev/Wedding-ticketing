import { TicketStatus, TicketType } from "@prisma/client";

export type TicketListStatus = Extract<
  TicketStatus,
  "ACTIVE" | "USED" | "REVOKED" | "CANCELLED"
>;

export interface TicketGuestSummary {
  id: string;
  lastName: string;
  firstNames: string;
  position: number;
}

export interface TicketTableSummary {
  id: string;
  label: string;
  capacity: number;
}

export interface TicketRecord {
  id: string;
  shortCode: string;
  type: TicketType;
  status: TicketStatus;
  version: number;
  table: TicketTableSummary;
  guests: TicketGuestSummary[];
  issuedAt: string;
  pdfAvailable: boolean;
  pdfGeneratedAt: string | null;
  pdfError: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EligibleGuestOption {
  id: string;
  lastName: string;
  firstNames: string;
  notes: string | null;
}

export interface AvailableTableOption {
  id: string;
  label: string;
  capacity: number;
  occupiedSeats: number;
  availableSeats: number;
}

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  ACTIVE: "Actif",
  USED: "Utilisé",
  REVOKED: "Révoqué",
  CANCELLED: "Annulé",
};

export const TICKET_TYPE_LABELS: Record<TicketType, string> = {
  SINGLE: "Single",
  COUPLE: "Couple",
};

export const TICKET_TEMPLATES_BUCKET = "ticket-templates";
export const TICKET_PDFS_BUCKET = "ticket-pdfs";

/** Coordonnées QR validées (points PDF, origine bas-gauche) — panneau droit supérieur. */
export const DEFAULT_QR_LAYOUT = {
  pageNumber: 1,
  qrX: 450,
  qrY: 680,
  qrSize: 88,
} as const;
