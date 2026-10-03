import ExcelJS from "exceljs";

import { formatGuestFullName } from "@/lib/guests";
import {
  formatOccupancyRate,
  formatTableOccupancy,
  getTableStatusLabel,
} from "@/lib/tables";
import type { TableExportMeta, TableExportRow } from "@/types/tables";

const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF1A1A1A" },
};

const ACCENT_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFF48120" },
};

const SUBTLE_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFFFF1E6" },
};

const ALT_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFFAFAF8" },
};

const FULL_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFFEF3C7" },
};

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: "FFD6D3D1" } },
  left: { style: "thin", color: { argb: "FFD6D3D1" } },
  bottom: { style: "thin", color: { argb: "FFD6D3D1" } },
  right: { style: "thin", color: { argb: "FFD6D3D1" } },
};

function formatWeddingDate(date: Date | null): string {
  if (!date) return "";
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function applyHeaderRow(row: ExcelJS.Row, columnCount: number) {
  row.height = 22;
  row.font = { bold: true, color: { argb: "FFFFFFFF" }, name: "Calibri", size: 11 };
  row.alignment = { vertical: "middle", horizontal: "left" };
  for (let column = 1; column <= columnCount; column += 1) {
    const cell = row.getCell(column);
    cell.fill = HEADER_FILL;
    cell.border = THIN_BORDER;
  }
}

function styleDataCell(cell: ExcelJS.Cell, fill?: ExcelJS.Fill) {
  cell.border = THIN_BORDER;
  cell.font = { name: "Calibri", size: 11, color: { argb: "FF1C1917" } };
  cell.alignment = { vertical: "middle", wrapText: true };
  if (fill) cell.fill = fill;
}

export function buildTablesWorkbookTitle(meta: TableExportMeta): string {
  const date = formatWeddingDate(meta.weddingDate);
  if (date && meta.venueName) {
    return `${meta.eventName} — ${date} — ${meta.venueName}`;
  }
  if (date) return `${meta.eventName} — ${date}`;
  if (meta.venueName) return `${meta.eventName} — ${meta.venueName}`;
  return meta.eventName;
}

export async function buildTablesWorkbookBuffer(params: {
  tables: TableExportRow[];
  meta: TableExportMeta;
  generatedAt?: Date;
}): Promise<Buffer> {
  const generatedAt = params.generatedAt ?? new Date();
  const title = buildTablesWorkbookTitle(params.meta);
  const generatedLabel = generatedAt.toLocaleString("fr-FR");

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Billetterie mariage";
  workbook.created = generatedAt;

  addSummarySheet(workbook, params.tables, title, generatedLabel);
  addGuestsSheet(workbook, params.tables, title, generatedLabel);

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

function addSummarySheet(
  workbook: ExcelJS.Workbook,
  tables: TableExportRow[],
  title: string,
  generatedLabel: string,
) {
  const sheet = workbook.addWorksheet("Récapitulatif", {
    views: [{ state: "frozen", ySplit: 4, showGridLines: false }],
    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1, paperSize: 9 },
  });

  sheet.columns = [
    { width: 28 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 16 },
    { width: 16 },
    { width: 14 },
    { width: 36 },
  ];

  sheet.mergeCells("A1:H1");
  sheet.getCell("A1").value = "Plan de table";
  sheet.getCell("A1").font = { bold: true, name: "Calibri", size: 16, color: { argb: "FF1A1A1A" } };

  sheet.mergeCells("A2:H2");
  sheet.getCell("A2").value = title;
  sheet.getCell("A2").font = { name: "Calibri", size: 11, color: { argb: "FF57534E" } };

  sheet.mergeCells("A3:H3");
  sheet.getCell("A3").value = `Généré le ${generatedLabel} · ${tables.length} table${tables.length > 1 ? "s" : ""}`;
  sheet.getCell("A3").font = { name: "Calibri", size: 10, color: { argb: "FF78716C" } };

  const header = sheet.getRow(4);
  header.values = [
    "Table",
    "Places",
    "Occupées",
    "Libres",
    "Occupation",
    "Statut",
    "Invités",
    "Liste des invités",
  ];
  applyHeaderRow(header, 8);

  tables.forEach((table, index) => {
    const row = sheet.getRow(5 + index);
    const fill = table.status === "FULL" ? FULL_FILL : index % 2 === 0 ? undefined : ALT_FILL;
    const guestNames = table.guests
      .map((guest) => formatGuestFullName(guest.lastName, guest.firstNames))
      .join(" · ");

    row.values = [
      table.label,
      table.capacity,
      table.assignedCount,
      table.availableCount,
      formatOccupancyRate(table.assignedCount, table.capacity),
      getTableStatusLabel(table.status),
      table.guests.length,
      guestNames || "Aucun invité actif",
    ];
    row.height = 20;
    for (let column = 1; column <= 8; column += 1) {
      styleDataCell(row.getCell(column), fill);
    }
    row.getCell(2).alignment = { vertical: "middle", horizontal: "center" };
    row.getCell(3).alignment = { vertical: "middle", horizontal: "center" };
    row.getCell(4).alignment = { vertical: "middle", horizontal: "center" };
    row.getCell(5).alignment = { vertical: "middle", horizontal: "center" };
    row.getCell(7).alignment = { vertical: "middle", horizontal: "center" };
  });

  if (tables.length > 0) {
    sheet.autoFilter = {
      from: { row: 4, column: 1 },
      to: { row: 4 + tables.length, column: 8 },
    };
  }

  const totalsRow = sheet.getRow(5 + tables.length + 1);
  const totalCapacity = tables.reduce((sum, table) => sum + table.capacity, 0);
  const totalAssigned = tables.reduce((sum, table) => sum + table.assignedCount, 0);
  const totalAvailable = tables.reduce((sum, table) => sum + table.availableCount, 0);

  totalsRow.values = [
    "Total",
    totalCapacity,
    totalAssigned,
    totalAvailable,
    formatOccupancyRate(totalAssigned, totalCapacity),
    "",
    totalAssigned,
    "",
  ];
  totalsRow.font = { bold: true, name: "Calibri", size: 11 };
  for (let column = 1; column <= 8; column += 1) {
    const cell = totalsRow.getCell(column);
    cell.fill = SUBTLE_FILL;
    cell.border = THIN_BORDER;
    cell.alignment = { vertical: "middle" };
  }
}

function addGuestsSheet(
  workbook: ExcelJS.Workbook,
  tables: TableExportRow[],
  title: string,
  generatedLabel: string,
) {
  const sheet = workbook.addWorksheet("Invités par table", {
    views: [{ state: "frozen", ySplit: 3, showGridLines: false }],
    pageSetup: { orientation: "portrait", fitToPage: true, fitToWidth: 1, paperSize: 9 },
  });

  sheet.columns = [
    { width: 8 },
    { width: 26 },
    { width: 26 },
    { width: 42 },
  ];

  sheet.mergeCells("A1:D1");
  sheet.getCell("A1").value = "Invités par table";
  sheet.getCell("A1").font = { bold: true, name: "Calibri", size: 16, color: { argb: "FF1A1A1A" } };

  sheet.mergeCells("A2:D2");
  sheet.getCell("A2").value = `${title} · Généré le ${generatedLabel}`;
  sheet.getCell("A2").font = { name: "Calibri", size: 10, color: { argb: "FF78716C" } };

  let currentRow = 4;

  tables.forEach((table) => {
    sheet.mergeCells(`A${currentRow}:D${currentRow}`);
    const titleCell = sheet.getCell(`A${currentRow}`);
    titleCell.value = table.label;
    titleCell.fill = ACCENT_FILL;
    titleCell.font = { bold: true, name: "Calibri", size: 12, color: { argb: "FFFFFFFF" } };
    titleCell.alignment = { vertical: "middle" };
    sheet.getRow(currentRow).height = 22;
    currentRow += 1;

    sheet.mergeCells(`A${currentRow}:D${currentRow}`);
    const metaCell = sheet.getCell(`A${currentRow}`);
    metaCell.value = `${table.capacity} places · ${table.assignedCount} occupée${table.assignedCount > 1 ? "s" : ""} · ${table.availableCount} libre${table.availableCount > 1 ? "s" : ""} · ${formatTableOccupancy(table.assignedCount, table.capacity)} · ${formatOccupancyRate(table.assignedCount, table.capacity)} · ${getTableStatusLabel(table.status)}`;
    metaCell.fill = SUBTLE_FILL;
    metaCell.font = { name: "Calibri", size: 10, color: { argb: "FF44403C" } };
    metaCell.alignment = { vertical: "middle", wrapText: true };
    sheet.getRow(currentRow).height = 20;
    currentRow += 1;

    const header = sheet.getRow(currentRow);
    header.values = ["N°", "Nom", "Prénoms", "Notes"];
    applyHeaderRow(header, 4);
    currentRow += 1;

    if (table.guests.length === 0) {
      sheet.mergeCells(`A${currentRow}:D${currentRow}`);
      const emptyCell = sheet.getCell(`A${currentRow}`);
      emptyCell.value = "Aucun invité actif sur cette table.";
      emptyCell.font = { italic: true, name: "Calibri", size: 11, color: { argb: "FF78716C" } };
      emptyCell.alignment = { vertical: "middle" };
      emptyCell.border = THIN_BORDER;
      currentRow += 1;
    } else {
      table.guests.forEach((guest, index) => {
        const row = sheet.getRow(currentRow);
        row.values = [
          index + 1,
          guest.lastName.trim().toUpperCase(),
          guest.firstNames.trim(),
          guest.notes?.trim() || "",
        ];
        const fill = index % 2 === 0 ? undefined : ALT_FILL;
        for (let column = 1; column <= 4; column += 1) {
          styleDataCell(row.getCell(column), fill);
        }
        row.getCell(1).alignment = { vertical: "middle", horizontal: "center" };
        currentRow += 1;
      });
    }

    currentRow += 1;
  });
}
