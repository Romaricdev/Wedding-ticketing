import { prisma } from "@/lib/prisma";
import { guestIdentityKey, toGuestRecord } from "@/lib/guests";
import { GuestError } from "@/server/guests/errors";
import type { GuestRecord } from "@/types/guests";

export async function listGuestsForEvent(eventId: string): Promise<GuestRecord[]> {
  const guests = await prisma.guest.findMany({
    where: {
      eventId,
    },
    orderBy: [{ lastName: "asc" }, { firstNames: "asc" }],
    select: {
      id: true,
      lastName: true,
      firstNames: true,
      notes: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return guests.map(toGuestRecord);
}

export async function getGuestForEvent(
  eventId: string,
  guestId: string,
): Promise<GuestRecord> {
  const guest = await prisma.guest.findFirst({
    where: { id: guestId, eventId },
    select: {
      id: true,
      lastName: true,
      firstNames: true,
      notes: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!guest) {
    throw new GuestError("NOT_FOUND", "Invité introuvable.");
  }

  return toGuestRecord(guest);
}

export async function findExistingGuestIdentityKeys(
  eventId: string,
  keys: string[],
): Promise<Set<string>> {
  if (keys.length === 0) {
    return new Set();
  }

  const guests = await prisma.guest.findMany({
    where: {
      eventId,
    },
    select: {
      lastName: true,
      firstNames: true,
    },
  });

  const existing = new Set(guests.map((guest) => guestIdentityKey(guest.lastName, guest.firstNames)));
  return new Set(keys.filter((key) => existing.has(key)));
}
