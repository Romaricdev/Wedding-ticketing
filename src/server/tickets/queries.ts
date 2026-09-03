import { GuestStatus, TicketStatus, TicketType } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { occupiesTableSeats, seatsForTicketType, toTicketRecord } from "@/lib/tickets";
import { TicketError } from "@/server/tickets/errors";
import type {
  AvailableTableOption,
  EligibleGuestOption,
  TicketRecord,
} from "@/types/tickets";

const ticketInclude = {
  diningTable: {
    select: { id: true, label: true, capacity: true },
  },
  ticketGuests: {
    include: {
      guest: {
        select: { id: true, lastName: true, firstNames: true },
      },
    },
  },
} as const;

export async function listTicketsForEvent(eventId: string): Promise<TicketRecord[]> {
  const tickets = await prisma.ticket.findMany({
    where: { eventId },
    include: ticketInclude,
    orderBy: [{ issuedAt: "desc" }, { shortCode: "asc" }],
  });

  return tickets.map(toTicketRecord);
}

export async function getTicketForEvent(
  eventId: string,
  ticketId: string,
): Promise<TicketRecord> {
  const ticket = await prisma.ticket.findFirst({
    where: { id: ticketId, eventId },
    include: ticketInclude,
  });

  if (!ticket) {
    throw new TicketError("NOT_FOUND", "Billet introuvable.");
  }

  return toTicketRecord(ticket);
}

export async function getActiveTemplateForEvent(eventId: string) {
  return prisma.ticketTemplate.findFirst({
    where: { eventId, isActive: true },
  });
}

export async function getEligibleGuestsForTicket(
  eventId: string,
): Promise<EligibleGuestOption[]> {
  const guests = await prisma.guest.findMany({
    where: {
      eventId,
      status: GuestStatus.ACTIVE,
      ticketGuests: {
        none: {
          ticket: {
            status: TicketStatus.ACTIVE,
          },
        },
      },
    },
    orderBy: [{ lastName: "asc" }, { firstNames: "asc" }],
    select: {
      id: true,
      lastName: true,
      firstNames: true,
      notes: true,
    },
  });

  return guests;
}

export async function getOccupiedSeatsByTable(
  eventId: string,
  tableId: string,
): Promise<number> {
  const tickets = await prisma.ticket.findMany({
    where: {
      eventId,
      tableId,
      status: { in: [TicketStatus.ACTIVE, TicketStatus.USED] },
    },
    select: { type: true },
  });

  return tickets.reduce((sum, ticket) => sum + seatsForTicketType(ticket.type), 0);
}

export async function getAvailableTablesForTicket(
  eventId: string,
  requiredSeats: number,
): Promise<AvailableTableOption[]> {
  const tables = await prisma.diningTable.findMany({
    where: { eventId },
    orderBy: { label: "asc" },
  });

  const activeTickets = await prisma.ticket.findMany({
    where: {
      eventId,
      status: { in: [TicketStatus.ACTIVE, TicketStatus.USED] },
    },
    select: { tableId: true, type: true },
  });

  const occupiedByTable = new Map<string, number>();
  for (const ticket of activeTickets) {
    const current = occupiedByTable.get(ticket.tableId) ?? 0;
    occupiedByTable.set(ticket.tableId, current + seatsForTicketType(ticket.type));
  }

  return tables
    .map((table) => {
      const occupiedSeats = occupiedByTable.get(table.id) ?? 0;
      const availableSeats = Math.max(0, table.capacity - occupiedSeats);
      return {
        id: table.id,
        label: table.label,
        capacity: table.capacity,
        occupiedSeats,
        availableSeats,
      };
    })
    .filter((table) => table.availableSeats >= requiredSeats);
}

export async function guestHasActiveTicket(
  eventId: string,
  guestId: string,
): Promise<boolean> {
  const existing = await prisma.ticketGuest.findFirst({
    where: {
      guestId,
      ticket: {
        eventId,
        status: TicketStatus.ACTIVE,
      },
    },
    select: { ticketId: true },
  });

  return Boolean(existing);
}

export { occupiesTableSeats, TicketType };
