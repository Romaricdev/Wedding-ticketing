import { describe, expect, it, vi, beforeEach } from "vitest";

import { listActiveGuestsForTableForEvent } from "@/server/tables/queries";
import { TableError } from "@/server/tables/errors";

const findFirstTable = vi.fn();
const findManyGuests = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    diningTable: {
      findFirst: (...args: unknown[]) => findFirstTable(...args),
    },
    guest: {
      findMany: (...args: unknown[]) => findManyGuests(...args),
    },
  },
}));

describe("listActiveGuestsForTableForEvent", () => {
  beforeEach(() => {
    findFirstTable.mockReset();
    findManyGuests.mockReset();
  });

  it("refuse une table inconnue pour l'événement", async () => {
    findFirstTable.mockResolvedValue(null);

    await expect(
      listActiveGuestsForTableForEvent("event-1", "table-1"),
    ).rejects.toMatchObject({ code: "NOT_FOUND" } satisfies Partial<TableError>);
  });

  it("retourne les invités actifs triés par nom", async () => {
    findFirstTable.mockResolvedValue({ id: "table-1" });
    findManyGuests.mockResolvedValue([
      {
        id: "g1",
        lastName: "Martin",
        firstNames: "Marie",
        notes: null,
        status: "ACTIVE",
        createdAt: new Date("2026-01-01"),
        updatedAt: new Date("2026-01-01"),
      },
    ]);

    const guests = await listActiveGuestsForTableForEvent("event-1", "table-1");

    expect(guests).toHaveLength(1);
    expect(guests[0]?.lastName).toBe("Martin");
    expect(findManyGuests).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          eventId: "event-1",
          tableId: "table-1",
          status: "ACTIVE",
        }),
      }),
    );
  });
});
