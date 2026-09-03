import { describe, expect, it } from "vitest";

import {
  formatGuestFullName,
  guestIdentityKey,
  getGuestStatusLabel,
  toGuestRecord,
  truncateNotes,
} from "@/lib/guests";
import { GuestStatus } from "@prisma/client";

describe("lib/guests", () => {
  it("formate le nom complet", () => {
    expect(formatGuestFullName("Dupont", "Marie")).toBe("DUPONT Marie");
  });

  it("normalise la clé d'identité", () => {
    expect(guestIdentityKey("Dupont", "Marie")).toBe("dupont::marie");
  });

  it("tronque les notes", () => {
    expect(truncateNotes("Courte")).toBe("Courte");
    expect(truncateNotes("x".repeat(60), 20)).toBe(`${"x".repeat(19)}…`);
  });

  it("mappe un enregistrement invité", () => {
    const createdAt = new Date("2026-01-01T10:00:00.000Z");
    const updatedAt = new Date("2026-01-01T11:00:00.000Z");

    expect(
      toGuestRecord({
        id: "guest-1",
        lastName: "Dupont",
        firstNames: "Marie",
        notes: null,
        status: GuestStatus.ACTIVE,
        createdAt,
        updatedAt,
      }),
    ).toEqual({
      id: "guest-1",
      lastName: "Dupont",
      firstNames: "Marie",
      notes: null,
      status: GuestStatus.ACTIVE,
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
    });
  });

  it("étiquette les statuts", () => {
    expect(getGuestStatusLabel(GuestStatus.ACTIVE)).toBe("Actif");
    expect(getGuestStatusLabel(GuestStatus.CANCELLED)).toBe("Annulé");
  });
});
