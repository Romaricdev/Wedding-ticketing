import { EventRole, GuestStatus, TicketStatus, TicketType } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  getQrTokenSecret: () => "unit-test-qr-secret",
  getQrTokenPepper: () => "unit-test-qr-secret",
}));

vi.mock("@/server/tickets/pdf", () => ({
  renderAndStoreTicketPdf: vi.fn().mockResolvedValue({
    bucket: "ticket-pdfs",
    path: "events/event-1/tickets/ticket-1/v1.pdf",
  }),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    ticketTemplate: {
      findFirst: vi.fn(),
    },
    ticket: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    guest: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    ticketGuest: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { prisma } from "@/lib/prisma";
import {
  cancelTicketForEvent,
  createSingleTicketForEvent,
} from "@/server/tickets/mutations";
import { TicketError } from "@/server/tickets/errors";

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

describe("mutations tickets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("refuse la création sans template actif", async () => {
    vi.mocked(prisma.ticketTemplate.findFirst).mockResolvedValue(null);

    await expect(
      createSingleTicketForEvent(adminUser, {
        type: TicketType.SINGLE,
        guestId: "11111111-1111-4111-8111-111111111111",
        tableId: "22222222-2222-4222-8222-222222222222",
      }),
    ).rejects.toMatchObject({ code: "NO_ACTIVE_TEMPLATE" });
  });

  it("refuse si la capacité est dépassée", async () => {
    vi.mocked(prisma.ticketTemplate.findFirst).mockResolvedValue({
      id: "template-1",
      eventId: "event-1",
      storageBucket: "ticket-templates",
      storagePath: "source.pdf",
      originalFilename: "demo.pdf",
      pageNumber: 1,
      qrX: 450 as never,
      qrY: 680 as never,
      qrSize: 88 as never,
      isActive: true,
      createdByUserId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(prisma.$transaction).mockImplementation(async (callback) =>
      callback({
        $queryRaw: vi.fn().mockResolvedValue([
          { id: "22222222-2222-4222-8222-222222222222", capacity: 1, label: "Table 1" },
        ]),
        guest: {
          findMany: vi.fn().mockResolvedValue([
            {
              id: "11111111-1111-4111-8111-111111111111",
              lastName: "Dupont",
              firstNames: "Jean",
              status: GuestStatus.ACTIVE,
            },
          ]),
        },
        ticketGuest: {
          findMany: vi.fn().mockResolvedValue([]),
        },
        ticket: {
          findMany: vi.fn().mockResolvedValue([{ type: TicketType.SINGLE }]),
          findFirst: vi.fn(),
          create: vi.fn(),
        },
        auditLog: { create: vi.fn() },
      } as never),
    );

    await expect(
      createSingleTicketForEvent(adminUser, {
        type: TicketType.SINGLE,
        guestId: "11111111-1111-4111-8111-111111111111",
        tableId: "22222222-2222-4222-8222-222222222222",
      }),
    ).rejects.toBeInstanceOf(TicketError);
  });

  it("isole l'annulation par event_id", async () => {
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) =>
      callback({
        ticket: {
          findFirst: vi.fn().mockResolvedValue(null),
        },
      } as never),
    );

    await expect(cancelTicketForEvent(adminUser, "foreign-ticket")).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("refuse d'annuler un billet déjà annulé", async () => {
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) =>
      callback({
        ticket: {
          findFirst: vi.fn().mockResolvedValue({
            id: "ticket-1",
            eventId: "event-1",
            status: TicketStatus.CANCELLED,
            tableId: "table-1",
            type: TicketType.SINGLE,
            ticketGuests: [],
          }),
        },
      } as never),
    );

    await expect(cancelTicketForEvent(adminUser, "ticket-1")).rejects.toMatchObject({
      code: "ALREADY_CANCELLED",
    });
  });
});
