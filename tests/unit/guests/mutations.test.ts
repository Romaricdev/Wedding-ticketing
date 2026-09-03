import { EventRole, GuestStatus } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  cancelGuestForEvent,
  createGuestForEvent,
  updateGuestForEvent,
} from "@/server/guests/mutations";
import { GuestError } from "@/server/guests/errors";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    guest: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { prisma } from "@/lib/prisma";

const adminUser = {
  id: "admin-1",
  eventId: "event-1",
  authUserId: "auth-1",
  displayName: "Admin",
  role: EventRole.ADMIN,
  isActive: true,
  lastLoginAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  event: {
    id: "event-1",
    name: "Mariage",
    status: "ACTIVE" as const,
  },
};

describe("mutations guests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("crée un invité et écrit un audit", async () => {
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) =>
      callback({
        guest: {
          create: vi.fn().mockResolvedValue({
            id: "guest-1",
            eventId: "event-1",
            lastName: "Dupont",
            firstNames: "Marie",
            notes: null,
            status: GuestStatus.ACTIVE,
            tableId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        },
        auditLog: {
          create: vi.fn().mockResolvedValue({ id: "audit-1" }),
        },
      } as never),
    );

    const guest = await createGuestForEvent(adminUser, {
      lastName: "Dupont",
      firstNames: "Marie",
      notes: null,
    });

    expect(guest.lastName).toBe("Dupont");
    expect(guest.status).toBe(GuestStatus.ACTIVE);
    expect(prisma.$transaction).toHaveBeenCalledOnce();
  });

  it("refuse la modification d'un invité annulé", async () => {
    vi.mocked(prisma.guest.findFirst).mockResolvedValue({
      id: "guest-1",
      eventId: "event-1",
      lastName: "Dupont",
      firstNames: "Marie",
      notes: null,
      status: GuestStatus.CANCELLED,
      tableId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(
      updateGuestForEvent(adminUser, "guest-1", {
        lastName: "Dupont",
        firstNames: "Marie",
        notes: null,
      }),
    ).rejects.toMatchObject({ code: "ALREADY_CANCELLED" });
  });

  it("annule un invité actif", async () => {
    vi.mocked(prisma.guest.findFirst).mockResolvedValue({
      id: "guest-1",
      eventId: "event-1",
      lastName: "Dupont",
      firstNames: "Marie",
      notes: null,
      status: GuestStatus.ACTIVE,
      tableId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(prisma.$transaction).mockImplementation(async (callback) =>
      callback({
        guest: {
          update: vi.fn().mockResolvedValue({
            id: "guest-1",
            eventId: "event-1",
            lastName: "Dupont",
            firstNames: "Marie",
            notes: null,
            status: GuestStatus.CANCELLED,
            tableId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        },
        auditLog: {
          create: vi.fn().mockResolvedValue({ id: "audit-2" }),
        },
      } as never),
    );

    const guest = await cancelGuestForEvent(adminUser, "guest-1", {
      reason: "Désistement",
    });

    expect(guest.status).toBe(GuestStatus.CANCELLED);
  });

  it("refuse l'annulation d'un invité déjà annulé", async () => {
    vi.mocked(prisma.guest.findFirst).mockResolvedValue({
      id: "guest-1",
      eventId: "event-1",
      lastName: "Dupont",
      firstNames: "Marie",
      notes: null,
      status: GuestStatus.CANCELLED,
      tableId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(cancelGuestForEvent(adminUser, "guest-1")).rejects.toBeInstanceOf(
      GuestError,
    );
  });

  it("isole les invités par event_id", async () => {
    vi.mocked(prisma.guest.findFirst).mockResolvedValue(null);

    await expect(cancelGuestForEvent(adminUser, "foreign-guest")).rejects.toMatchObject({
      code: "NOT_FOUND",
    });

    expect(prisma.guest.findFirst).toHaveBeenCalledWith({
      where: { id: "foreign-guest", eventId: "event-1" },
    });
  });
});
