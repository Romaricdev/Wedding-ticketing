import { describe, expect, it } from "vitest";
import ExcelJS from "exceljs";

import { occupancyPercent } from "@/lib/tables";
import {
  buildTablesWorkbookBuffer,
  buildTablesWorkbookTitle,
} from "@/server/tables/export";
import type { TableExportRow } from "@/types/tables";

const tables: TableExportRow[] = [
  {
    label: "Barcelone",
    capacity: 8,
    assignedCount: 2,
    availableCount: 6,
    status: "AVAILABLE",
    guests: [
      { lastName: "Dupont", firstNames: "Jean", notes: null },
      { lastName: "Martin", firstNames: "Marie", notes: "Allergie" },
    ],
  },
  {
    label: "Lyon",
    capacity: 2,
    assignedCount: 0,
    availableCount: 2,
    status: "AVAILABLE",
    guests: [],
  },
];

describe("export Excel des tables", () => {
  it("calcule le taux d'occupation", () => {
    expect(occupancyPercent(2, 8)).toBe(25);
    expect(occupancyPercent(2, 2)).toBe(100);
    expect(occupancyPercent(1, 0)).toBe(0);
  });

  it("compose un titre d'événement lisible", () => {
    expect(
      buildTablesWorkbookTitle({
        eventName: "Mariage de démonstration",
        venueName: "Yaoundé",
        weddingDate: new Date("2026-08-15T10:00:00.000Z"),
      }),
    ).toContain("Mariage de démonstration");
  });

  it("produit un classeur avec récapitulatif et invités par table", async () => {
    const buffer = await buildTablesWorkbookBuffer({
      tables,
      meta: { eventName: "Mariage de démonstration", venueName: null, weddingDate: null },
      generatedAt: new Date("2026-10-03T12:00:00.000Z"),
    });

    expect(buffer.subarray(0, 2).toString()).toBe("PK");

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);

    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual([
      "Récapitulatif",
      "Invités par table",
    ]);

    const summary = workbook.getWorksheet("Récapitulatif");
    expect(summary?.getRow(5).getCell(1).value).toBe("Barcelone");
    expect(summary?.getRow(5).getCell(2).value).toBe(8);
    expect(summary?.getRow(5).getCell(3).value).toBe(2);
    expect(summary?.getRow(5).getCell(5).value).toBe("25 %");
    expect(String(summary?.getRow(5).getCell(8).value)).toContain("DUPONT Jean");
    expect(summary?.getRow(6).getCell(1).value).toBe("Lyon");
    expect(summary?.getRow(6).getCell(8).value).toBe("Aucun invité actif");

    const detail = workbook.getWorksheet("Invités par table");
    const values: string[] = [];
    detail?.eachRow((row) => {
      values.push(String(row.getCell(1).value ?? ""));
    });
    expect(values).toContain("Barcelone");
    expect(values).toContain("Lyon");
    expect(values).toContain("Aucun invité actif sur cette table.");
  });
});
