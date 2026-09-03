"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import { AuthError } from "@/types/auth";
import { requireAdmin } from "@/server/auth";
import {
  DATABASE_UNAVAILABLE_MESSAGE,
  isDatabaseConnectionError,
} from "@/lib/database-errors";
import { getGuestStatusLabel, guestIdentityKey } from "@/lib/guests";
import {
  archiveGuestForEvent,
  archiveGuestsForEvent,
  cancelGuestForEvent,
  cancelGuestsForEvent,
  createGuestForEvent,
  importGuestsForEvent,
  updateGuestForEvent,
} from "@/server/guests/mutations";
import { findExistingGuestIdentityKeys, listGuestsForEvent } from "@/server/guests/queries";
import { GuestError } from "@/server/guests/errors";
import {
  parseGuestCancelFormData,
  parseGuestCsvText,
  parseGuestFormData,
  validateGuestCsvRows,
  type GuestCsvRowError,
  type GuestCsvValidatedRow,
  type GuestCsvWarning,
  type GuestFormValues,
} from "@/server/guests/validation";
import type { GuestRecord } from "@/types/guests";

export type GuestFormState = {
  success?: boolean;
  guest?: GuestRecord;
  error?: string;
  fieldErrors?: Partial<Record<"lastName" | "firstNames" | "notes", string>>;
  values?: GuestFormValues;
};

export type GuestCancelState = {
  success?: boolean;
  guest?: GuestRecord;
  error?: string;
  fieldErrors?: Partial<Record<"reason", string>>;
};

export type GuestArchiveState = {
  success?: boolean;
  guest?: GuestRecord;
  error?: string;
};
export type GuestBulkState = { success?: boolean; guests?: GuestRecord[]; error?: string };

export type GuestImportPreviewState = {
  success?: boolean;
  error?: string;
  validRows?: GuestCsvValidatedRow[];
  invalidRows?: GuestCsvRowError[];
  warnings?: GuestCsvWarning[];
  summary?: {
    total: number;
    valid: number;
    invalid: number;
    warnings: number;
  };
};

export type GuestImportConfirmState = {
  success?: boolean;
  guests?: GuestRecord[];
  error?: string;
  importedCount?: number;
};

export type GuestExportState = {
  success?: boolean;
  csv?: string;
  filename?: string;
  error?: string;
};

function revalidateGuestPaths() {
  revalidatePath("/admin/invites");
  revalidatePath("/admin");
}

function toFormValues(data: {
  lastName: string;
  firstNames: string;
  notes: string | null;
}): GuestFormValues {
  return {
    lastName: data.lastName,
    firstNames: data.firstNames,
    notes: data.notes ?? "",
  };
}

function mapFormActionError(
  error: unknown,
  values: GuestFormState["values"],
): GuestFormState {
  if (error instanceof GuestError) {
    return {
      error: error.message,
      fieldErrors: error.fieldErrors,
      values,
    };
  }

  if (error instanceof AuthError) {
    return { error: error.message, values };
  }

  if (isDatabaseConnectionError(error)) {
    return { error: DATABASE_UNAVAILABLE_MESSAGE, values };
  }

  return {
    error:
      "L'enregistrement a échoué côté serveur. Réessayez dans quelques secondes ou consultez les logs du terminal.",
    values,
  };
}

export async function createGuestAction(
  _prevState: GuestFormState,
  formData: FormData,
): Promise<GuestFormState> {
  const parsed = parseGuestFormData(formData);

  if (!parsed.success) {
    return {
      fieldErrors: parsed.fieldErrors,
      values: parsed.values,
    };
  }

  const values = toFormValues(parsed.data);

  try {
    const eventUser = await requireAdmin();
    const guest = await createGuestForEvent(eventUser, parsed.data);
    revalidateGuestPaths();
    return { success: true, guest };
  } catch (error) {
    return mapFormActionError(error, values);
  }
}

export async function updateGuestAction(
  guestId: string,
  _prevState: GuestFormState,
  formData: FormData,
): Promise<GuestFormState> {
  const parsed = parseGuestFormData(formData);

  if (!parsed.success) {
    return {
      fieldErrors: parsed.fieldErrors,
      values: parsed.values,
    };
  }

  const values = toFormValues(parsed.data);

  try {
    const eventUser = await requireAdmin();
    const guest = await updateGuestForEvent(eventUser, guestId, parsed.data);
    revalidateGuestPaths();
    return { success: true, guest };
  } catch (error) {
    return mapFormActionError(error, values);
  }
}

export async function cancelGuestAction(
  guestId: string,
  _prevState: GuestCancelState,
  formData: FormData,
): Promise<GuestCancelState> {
  const parsed = parseGuestCancelFormData(formData);

  if (!parsed.success) {
    return { fieldErrors: parsed.fieldErrors };
  }

  try {
    const eventUser = await requireAdmin();
    const guest = await cancelGuestForEvent(eventUser, guestId, parsed.data);
    revalidateGuestPaths();
    return { success: true, guest };
  } catch (error) {
    if (error instanceof GuestError) {
      return { error: error.message, fieldErrors: error.fieldErrors };
    }

    if (error instanceof AuthError) {
      return { error: error.message };
    }

    if (isDatabaseConnectionError(error)) {
      return { error: DATABASE_UNAVAILABLE_MESSAGE };
    }

    return {
      error: "L'annulation a échoué. Réessayez dans quelques secondes.",
    };
  }
}

export async function archiveGuestAction(guestId: string): Promise<GuestArchiveState> {
  try {
    const eventUser = await requireAdmin();
    const guest = await archiveGuestForEvent(eventUser, guestId);
    revalidateGuestPaths();
    return { success: true, guest };
  } catch (error) {
    if (error instanceof GuestError || error instanceof AuthError) return { error: error.message };
    if (isDatabaseConnectionError(error)) return { error: DATABASE_UNAVAILABLE_MESSAGE };
    return { error: "L’archivage a échoué. Réessayez dans quelques secondes." };
  }
}

export async function bulkArchiveGuestsAction(guestIds: string[]): Promise<GuestBulkState> {
  try { const eventUser = await requireAdmin(); const guests = await archiveGuestsForEvent(eventUser, guestIds); revalidateGuestPaths(); return { success: true, guests }; }
  catch (error) { return { error: error instanceof GuestError || error instanceof AuthError ? error.message : isDatabaseConnectionError(error) ? DATABASE_UNAVAILABLE_MESSAGE : "L’archivage groupé a échoué." }; }
}

export async function bulkCancelGuestsAction(guestIds: string[]): Promise<GuestBulkState> {
  try { const eventUser = await requireAdmin(); const guests = await cancelGuestsForEvent(eventUser, guestIds); revalidateGuestPaths(); return { success: true, guests }; }
  catch (error) { return { error: error instanceof GuestError || error instanceof AuthError ? error.message : isDatabaseConnectionError(error) ? DATABASE_UNAVAILABLE_MESSAGE : "L’annulation groupée a échoué." }; }
}

export async function previewGuestImportAction(
  _prevState: GuestImportPreviewState,
  formData: FormData,
): Promise<GuestImportPreviewState> {
  try {
    const eventUser = await requireAdmin();
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      return { error: "Sélectionnez un fichier CSV à importer." };
    }

    if (file.size > 1_000_000) {
      return { error: "Le fichier est trop volumineux (maximum 1 Mo)." };
    }

    const content = await file.text();
    const parsed = parseGuestCsvText(content);

    if (!parsed.success) {
      return { error: parsed.error };
    }

    const { validRows, invalidRows, warnings } = validateGuestCsvRows(parsed.rows);
    const identityKeys = validRows.map((row) =>
      guestIdentityKey(row.lastName, row.firstNames),
    );
    const existingKeys = await findExistingGuestIdentityKeys(
      eventUser.eventId,
      identityKeys,
    );

    const dbWarnings: GuestCsvWarning[] = validRows
      .filter((row) => existingKeys.has(guestIdentityKey(row.lastName, row.firstNames)))
      .map((row) => ({
        lineNumber: row.lineNumber,
        message: "Doublon potentiel avec un invité déjà enregistré.",
      }));

    const allWarnings = [...warnings, ...dbWarnings];

    return {
      success: true,
      validRows,
      invalidRows,
      warnings: allWarnings,
      summary: {
        total: parsed.rows.length,
        valid: validRows.length,
        invalid: invalidRows.length,
        warnings: allWarnings.length,
      },
    };
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: error.message };
    }

    if (isDatabaseConnectionError(error)) {
      return { error: DATABASE_UNAVAILABLE_MESSAGE };
    }

    return {
      error: "Impossible d'analyser le fichier CSV. Vérifiez le format puis réessayez.",
    };
  }
}

export async function confirmGuestImportAction(
  rowsJson: string,
): Promise<GuestImportConfirmState> {
  try {
    const eventUser = await requireAdmin();

    let rawRows: unknown;
    try {
      rawRows = JSON.parse(rowsJson);
    } catch {
      return { error: "Les données d'import sont invalides. Relancez la prévisualisation." };
    }

    if (!Array.isArray(rawRows) || rawRows.length === 0) {
      return { error: "Aucune ligne valide à importer." };
    }

    const revalidated: GuestCsvValidatedRow[] = [];
    const invalidRows: GuestCsvRowError[] = [];

    for (const [index, raw] of rawRows.entries()) {
      const lineNumber =
        typeof raw === "object" &&
        raw !== null &&
        "lineNumber" in raw &&
        typeof (raw as { lineNumber: unknown }).lineNumber === "number"
          ? (raw as { lineNumber: number }).lineNumber
          : index + 2;

      const lastName =
        typeof raw === "object" && raw !== null && "lastName" in raw
          ? String((raw as { lastName: unknown }).lastName ?? "")
          : "";
      const firstNames =
        typeof raw === "object" && raw !== null && "firstNames" in raw
          ? String((raw as { firstNames: unknown }).firstNames ?? "")
          : "";
      const notes =
        typeof raw === "object" && raw !== null && "notes" in raw
          ? String((raw as { notes: unknown }).notes ?? "")
          : "";

      const { validRows, invalidRows: rowErrors } = validateGuestCsvRows([
        { lineNumber, lastName, firstNames, notes },
      ]);

      if (rowErrors.length > 0 || validRows.length === 0) {
        invalidRows.push(
          rowErrors[0] ?? {
            lineNumber,
            message: "Ligne invalide.",
          },
        );
        continue;
      }

      revalidated.push(validRows[0]!);
    }

    if (invalidRows.length > 0) {
      return {
        error: `Import refusé : ${invalidRows.length} ligne(s) invalide(s). Aucune donnée n'a été écrite.`,
      };
    }

    const guests = await importGuestsForEvent(eventUser, revalidated);
    revalidateGuestPaths();

    return {
      success: true,
      guests,
      importedCount: guests.length,
    };
  } catch (error) {
    if (error instanceof GuestError) {
      return { error: error.message };
    }

    if (error instanceof AuthError) {
      return { error: error.message };
    }

    if (isDatabaseConnectionError(error)) {
      return { error: DATABASE_UNAVAILABLE_MESSAGE };
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return {
        error: "L'import a échoué côté serveur. Aucune donnée partielle n'a été conservée.",
      };
    }

    return {
      error: "L'import a échoué. Réessayez dans quelques secondes.",
    };
  }
}

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function exportGuestsCsvAction(): Promise<GuestExportState> {
  try {
    const eventUser = await requireAdmin();
    const guests = await listGuestsForEvent(eventUser.eventId);

    const header = ["Nom", "Prénoms", "Notes", "Statut", "Date de création"];
    const lines = guests.map((guest) =>
      [
        guest.lastName,
        guest.firstNames,
        guest.notes ?? "",
        getGuestStatusLabel(guest.status),
        new Date(guest.createdAt).toLocaleString("fr-FR"),
      ]
        .map((cell) => escapeCsvCell(cell))
        .join(","),
    );

    const csv = `\uFEFF${[header.join(","), ...lines].join("\r\n")}\r\n`;
    const stamp = new Date().toISOString().slice(0, 10);

    return {
      success: true,
      csv,
      filename: `invites-${stamp}.csv`,
    };
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: error.message };
    }

    if (isDatabaseConnectionError(error)) {
      return { error: DATABASE_UNAVAILABLE_MESSAGE };
    }

    return { error: "L'export CSV a échoué. Réessayez dans quelques secondes." };
  }
}
