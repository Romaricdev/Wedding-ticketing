import { describe, expect, it } from "vitest";

import { formatEventMeta } from "@/server/admin/dashboard";

describe("formatEventMeta", () => {
  it("formate date et lieu", () => {
    const formatted = formatEventMeta({
      name: "Mariage",
      weddingDate: new Date("2026-06-15T14:00:00.000Z"),
      venueName: "Salle des fêtes",
      timezone: "Europe/Paris",
    });

    expect(formatted).toContain("Salle des fêtes");
    expect(formatted).toContain("·");
  });

  it("retourne une chaîne vide sans date ni lieu", () => {
    expect(
      formatEventMeta({
        name: "Mariage",
        weddingDate: null,
        venueName: null,
        timezone: "Europe/Paris",
      }),
    ).toBe("");
  });
});
