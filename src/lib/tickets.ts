import { TicketStatus, TicketType, type Ticket, type TicketGuest, type Guest, type DiningTable } from "@prisma/client";

import {
  TICKET_STATUS_LABELS,
  TICKET_TYPE_LABELS,
  type TicketRecord,
} from "@/types/tickets";

export function seatsForTicketType(type: TicketType): number {
  return type === TicketType.COUPLE ? 2 : 1;
}

export function getTicketStatusLabel(status: TicketStatus): string {
  return TICKET_STATUS_LABELS[status];
}

export function getTicketTypeLabel(type: TicketType): string {
  return TICKET_TYPE_LABELS[type];
}

export function formatTicketGuests(
  guests: Array<{ lastName: string; firstNames: string }>,
): string {
  return guests
    .map((guest) => `${guest.lastName.toUpperCase()} ${guest.firstNames}`)
    .join(" · ");
}

function filenameSegment(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

/** A readable, collision-resistant filename for a downloaded invitation PDF. */
export function getTicketPdfFilename(ticket: {
  shortCode: string;
  guests: Array<{ lastName: string; firstNames: string }>;
}): string {
  const guests = ticket.guests
    .map((guest) => filenameSegment(`${guest.firstNames}-${guest.lastName}`))
    .filter(Boolean)
    .join("-et-");
  return `billet-${guests || filenameSegment(ticket.shortCode)}-${filenameSegment(ticket.shortCode)}.pdf`;
}

export function isTicketPdfReady(ticket: {
  pdfStoragePath: string | null;
  pdfGeneratedAt: Date | string | null;
  pdfError: string | null;
}): boolean {
  return Boolean(ticket.pdfStoragePath && ticket.pdfGeneratedAt && !ticket.pdfError);
}

type TicketWithRelations = Ticket & {
  diningTable: Pick<DiningTable, "id" | "label" | "capacity">;
  ticketGuests: Array<
    TicketGuest & {
      guest: Pick<Guest, "id" | "lastName" | "firstNames">;
    }
  >;
};

export function toTicketRecord(ticket: TicketWithRelations): TicketRecord {
  const guests = [...ticket.ticketGuests]
    .sort((left, right) => left.position - right.position)
    .map((entry) => ({
      id: entry.guest.id,
      lastName: entry.guest.lastName,
      firstNames: entry.guest.firstNames,
      position: entry.position,
    }));

  return {
    id: ticket.id,
    shortCode: ticket.shortCode,
    type: ticket.type,
    status: ticket.status,
    version: ticket.version,
    table: {
      id: ticket.diningTable.id,
      label: ticket.diningTable.label,
      capacity: ticket.diningTable.capacity,
    },
    guests,
    issuedAt: ticket.issuedAt.toISOString(),
    pdfAvailable: isTicketPdfReady(ticket),
    pdfGeneratedAt: ticket.pdfGeneratedAt?.toISOString() ?? null,
    pdfError: ticket.pdfError,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
  };
}

export function occupiesTableSeats(status: TicketStatus): boolean {
  return status === TicketStatus.ACTIVE || status === TicketStatus.USED;
}
