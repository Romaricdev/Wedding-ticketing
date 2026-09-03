import { z } from "zod";

export const guestLastNameSchema = z
  .string()
  .trim()
  .min(1, "Le nom est obligatoire.")
  .max(120, "Le nom ne peut pas dépasser 120 caractères.");

export const guestFirstNamesSchema = z
  .string()
  .trim()
  .min(1, "Les prénoms sont obligatoires.")
  .max(160, "Les prénoms ne peuvent pas dépasser 160 caractères.");

export const guestNotesSchema = z
  .string()
  .trim()
  .max(2000, "Les notes ne peuvent pas dépasser 2000 caractères.")
  .optional()
  .transform((value) => (value && value.length > 0 ? value : null));

export const guestFormSchema = z.object({
  lastName: guestLastNameSchema,
  firstNames: guestFirstNamesSchema,
  notes: guestNotesSchema,
});

export type GuestFormInput = z.infer<typeof guestFormSchema>;

export const guestCancelSchema = z.object({
  reason: z
    .string()
    .trim()
    .max(500, "Le motif ne peut pas dépasser 500 caractères.")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null)),
});

export type GuestCancelInput = z.infer<typeof guestCancelSchema>;

export type GuestFormValues = {
  lastName: string;
  firstNames: string;
  notes: string;
};

export function parseGuestFormData(formData: FormData):
  | { success: true; data: GuestFormInput }
  | {
      success: false;
      fieldErrors: Partial<Record<"lastName" | "firstNames" | "notes", string>>;
      values: GuestFormValues;
    } {
  const values: GuestFormValues = {
    lastName: String(formData.get("lastName") ?? ""),
    firstNames: String(formData.get("firstNames") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  };

  const parsed = guestFormSchema.safeParse(values);

  if (!parsed.success) {
    const fieldErrors: Partial<Record<"lastName" | "firstNames" | "notes", string>> = {};

    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (field === "lastName" || field === "firstNames" || field === "notes") {
        fieldErrors[field] = issue.message;
      }
    }

    return { success: false, fieldErrors, values };
  }

  return { success: true, data: parsed.data };
}

export function parseGuestCancelFormData(formData: FormData):
  | { success: true; data: GuestCancelInput }
  | {
      success: false;
      fieldErrors: Partial<Record<"reason", string>>;
    } {
  const parsed = guestCancelSchema.safeParse({
    reason: String(formData.get("reason") ?? ""),
  });

  if (!parsed.success) {
    const fieldErrors: Partial<Record<"reason", string>> = {};

    for (const issue of parsed.error.issues) {
      if (issue.path[0] === "reason") {
        fieldErrors.reason = issue.message;
      }
    }

    return { success: false, fieldErrors };
  }

  return { success: true, data: parsed.data };
}

/** Ligne CSV déjà normalisée (hors validation métier). */
export type GuestCsvRawRow = {
  lineNumber: number;
  lastName: string;
  firstNames: string;
  notes: string;
};

export type GuestCsvValidatedRow = GuestFormInput & { lineNumber: number };

export type GuestCsvRowError = {
  lineNumber: number;
  message: string;
};

export type GuestCsvWarning = {
  lineNumber: number;
  message: string;
};

const LAST_NAME_HEADERS = new Set(["nom", "lastname", "last_name", "name"]);
const FIRST_NAMES_HEADERS = new Set([
  "prenoms",
  "prénoms",
  "firstname",
  "firstnames",
  "first_name",
  "first_names",
  "prenom",
  "prénom",
]);
const NOTES_HEADERS = new Set(["notes", "note", "commentaire", "commentaires"]);

function normalizeHeader(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase("fr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current);
  return cells.map((cell) => cell.trim());
}

export function parseGuestCsvText(content: string):
  | { success: true; rows: GuestCsvRawRow[] }
  | { success: false; error: string } {
  const normalized = content.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalized
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line, index, all) => !(index === all.length - 1 && line.trim() === ""));

  if (lines.length === 0) {
    return { success: false, error: "Le fichier CSV est vide." };
  }

  const headerCells = splitCsvLine(lines[0]!).map(normalizeHeader);
  const lastNameIndex = headerCells.findIndex((header) => LAST_NAME_HEADERS.has(header));
  const firstNamesIndex = headerCells.findIndex((header) => FIRST_NAMES_HEADERS.has(header));
  const notesIndex = headerCells.findIndex((header) => NOTES_HEADERS.has(header));

  if (lastNameIndex < 0 || firstNamesIndex < 0) {
    return {
      success: false,
      error:
        "En-têtes CSV invalides. Attendu : nom,prenoms,notes (ou lastName,firstNames,notes).",
    };
  }

  if (lines.length === 1) {
    return { success: false, error: "Le fichier ne contient aucune ligne de données." };
  }

  const rows: GuestCsvRawRow[] = [];

  for (let index = 1; index < lines.length; index += 1) {
    const line = lines[index]!;
    if (line.trim() === "") continue;

    const cells = splitCsvLine(line);
    rows.push({
      lineNumber: index + 1,
      lastName: cells[lastNameIndex] ?? "",
      firstNames: cells[firstNamesIndex] ?? "",
      notes: notesIndex >= 0 ? (cells[notesIndex] ?? "") : "",
    });
  }

  if (rows.length === 0) {
    return { success: false, error: "Le fichier ne contient aucune ligne de données." };
  }

  return { success: true, rows };
}

export function validateGuestCsvRows(rows: GuestCsvRawRow[]): {
  validRows: GuestCsvValidatedRow[];
  invalidRows: GuestCsvRowError[];
  warnings: GuestCsvWarning[];
} {
  const validRows: GuestCsvValidatedRow[] = [];
  const invalidRows: GuestCsvRowError[] = [];
  const warnings: GuestCsvWarning[] = [];
  const seenInFile = new Map<string, number>();

  for (const row of rows) {
    const parsed = guestFormSchema.safeParse({
      lastName: row.lastName,
      firstNames: row.firstNames,
      notes: row.notes,
    });

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Ligne invalide.";
      invalidRows.push({ lineNumber: row.lineNumber, message });
      continue;
    }

    const key = `${parsed.data.lastName.toLocaleLowerCase("fr")}::${parsed.data.firstNames.toLocaleLowerCase("fr")}`;
    const previousLine = seenInFile.get(key);

    if (previousLine !== undefined) {
      warnings.push({
        lineNumber: row.lineNumber,
        message: `Doublon potentiel dans le fichier (identique à la ligne ${previousLine}).`,
      });
    } else {
      seenInFile.set(key, row.lineNumber);
    }

    validRows.push({
      lineNumber: row.lineNumber,
      ...parsed.data,
    });
  }

  return { validRows, invalidRows, warnings };
}
