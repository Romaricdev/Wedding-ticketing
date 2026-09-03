import { describe, expect, it } from "vitest";

import { computeTableStats, formatTableOccupancy, toTableWithStats } from "@/lib/tables";

describe("lib/tables", () => {
  it("calcule les places disponibles et le statut Disponible", () => {
    expect(computeTableStats(8, 0)).toEqual({
      assignedCount: 0,
      availableCount: 8,
      status: "AVAILABLE",
    });
  });

  it("marque une table complète sans dépassement", () => {
    expect(computeTableStats(6, 6)).toEqual({
      assignedCount: 6,
      availableCount: 0,
      status: "FULL",
    });
  });

  it("formate l'occupation", () => {
    expect(formatTableOccupancy(2, 8)).toBe("2 / 8");
  });

  it("mappe un enregistrement table vers TableWithStats", () => {
    const createdAt = new Date("2026-01-01T10:00:00.000Z");
    const updatedAt = new Date("2026-01-01T10:00:00.000Z");

    expect(
      toTableWithStats(
        {
          id: "table-1",
          label: "Paris",
          capacity: 8,
          createdAt,
          updatedAt,
        },
        0,
      ),
    ).toEqual({
      id: "table-1",
      label: "Paris",
      capacity: 8,
      assignedCount: 0,
      availableCount: 8,
      status: "AVAILABLE",
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
    });
  });
});
