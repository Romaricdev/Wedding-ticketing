import { EventRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export interface DashboardStats {
  tablesCount: number;
  guestsCount: number;
  controllersCount: number;
  ticketsCount: number;
}

export interface DashboardEventInfo {
  name: string;
  weddingDate: Date | null;
  venueName: string | null;
  timezone: string;
}

export async function getDashboardData(eventId: string): Promise<{
  event: DashboardEventInfo;
  stats: DashboardStats;
}> {
  const [event, tablesCount, guestsCount, controllersCount, ticketsCount] =
    await Promise.all([
      prisma.event.findUniqueOrThrow({
        where: { id: eventId },
        select: {
          name: true,
          weddingDate: true,
          venueName: true,
          timezone: true,
        },
      }),
      prisma.diningTable.count({ where: { eventId } }),
      prisma.guest.count({ where: { eventId, status: "ACTIVE" } }),
      prisma.eventUser.count({
        where: { eventId, role: EventRole.CONTROLLER, isActive: true },
      }),
      prisma.ticket.count({ where: { eventId } }),
    ]);

  return {
    event,
    stats: {
      tablesCount,
      guestsCount,
      controllersCount,
      ticketsCount,
    },
  };
}

export function formatEventMeta(event: DashboardEventInfo): string {
  const parts: string[] = [];

  if (event.weddingDate) {
    parts.push(
      new Intl.DateTimeFormat("fr-FR", {
        dateStyle: "long",
        timeZone: event.timezone,
      }).format(event.weddingDate),
    );
  }

  if (event.venueName) {
    parts.push(event.venueName);
  }

  return parts.join(" · ");
}
