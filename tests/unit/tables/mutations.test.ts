import { EventRole, Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createTableForEvent,
  deleteTableForEvent,
  updateTableForEvent,
} from "@/server/tables/mutations";
import { TableError } from "@/server/tables/errors";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    diningTable: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    guest: {
      count: vi.fn(),
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
    status: "ACTIVE",
  },
};

describe("mutations tables", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("crée une table et écrit un audit log", async () => {
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) =>
      callback({
        diningTable: {
          create: vi.fn().mockResolvedValue({
            id: "table-1",
            eventId: "event-1",
            label: "Table 12",
            capacity: 8,
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        },
        auditLog: {
          create: vi.fn().mockResolvedValue({ id: "audit-1" }),
        },
      } as never),
    );

    const table = await createTableForEvent(adminUser, {
      label: "Table 12",
      capacity: 8,
    });

    expect(table.label).toBe("Table 12");
    expect(prisma.$transaction).toHaveBeenCalledOnce();
  });

  it("refuse une capacité inférieure aux places attribuées", async () => {
    vi.mocked(prisma.diningTable.findFirst).mockResolvedValue({
      id: "table-1",
      eventId: "event-1",
      label: "Table 1",
      capacity: 8,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(prisma.guest.count).mockResolvedValue(3);

    await expect(
      updateTableForEvent(adminUser, "table-1", { label: "Table 1", capacity: 2 }),
    ).rejects.toMatchObject({
      code: "CAPACITY_TOO_LOW",
    });
  });

  it("refuse la suppression d'une table occupée", async () => {
    vi.mocked(prisma.diningTable.findFirst).mockResolvedValue({
      id: "table-1",
      eventId: "event-1",
      label: "Table 1",
      capacity: 8,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(prisma.guest.count).mockResolvedValue(2);

    await expect(deleteTableForEvent(adminUser, "table-1")).rejects.toBeInstanceOf(TableError);
  });

  it("refuse un doublon de nom", async () => {
    vi.mocked(prisma.$transaction).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "6.19.3",
      }),
    );

    await expect(
      createTableForEvent(adminUser, { label: "Table 12", capacity: 8 }),
    ).rejects.toMatchObject({ code: "DUPLICATE_LABEL" });
  });

  it("isole les tables par event_id à la suppression", async () => {
    vi.mocked(prisma.diningTable.findFirst).mockResolvedValue(null);

    await expect(deleteTableForEvent(adminUser, "foreign-table")).rejects.toMatchObject({
      code: "NOT_FOUND",
    });

    expect(prisma.diningTable.findFirst).toHaveBeenCalledWith({
      where: { id: "foreign-table", eventId: "event-1" },
    });
  });
});
