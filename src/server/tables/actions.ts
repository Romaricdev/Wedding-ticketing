"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { AuthError } from "@/types/auth";
import { requireAdmin } from "@/server/auth";
import {
  createTableForEvent,
  deleteTableForEvent,
  deleteTablesForEvent,
  updateTableForEvent,
} from "@/server/tables/mutations";
import { TableError } from "@/server/tables/errors";
import { parseTableFormData } from "@/server/tables/validation";
import { Prisma } from "@prisma/client";
import type { TableWithStats } from "@/types/tables";

export type TableFormState = {
  success?: boolean;
  table?: TableWithStats;
  error?: string;
  fieldErrors?: Partial<Record<"label" | "capacity", string>>;
  values?: { label: string; capacity: string };
};

function isNextRedirect(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

function revalidateTablePaths(tableId?: string) {
  revalidatePath("/admin/tables");

  if (tableId) {
    revalidatePath(`/admin/tables/${tableId}`);
  }
}

function toFormValues(data: { label: string; capacity: number }) {
  return {
    label: data.label,
    capacity: String(data.capacity),
  };
}

function mapActionError(error: unknown, values: TableFormState["values"]): TableFormState {
  if (error instanceof TableError) {
    return {
      error: error.message,
      fieldErrors: error.fieldErrors,
      values,
    };
  }

  if (error instanceof AuthError) {
    return {
      error: error.message,
      values,
    };
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P1001" || error.code === "P1002") {
      return {
        error:
          "Impossible de joindre la base de données. Vérifiez DATABASE_URL dans .env.local puis réessayez.",
        values,
      };
    }
  }

  return {
    error:
      "L'enregistrement a échoué côté serveur. Réessayez dans quelques secondes ou consultez les logs du terminal.",
    values,
  };
}

export async function createTableAction(
  _prevState: TableFormState,
  formData: FormData,
): Promise<TableFormState> {
  const parsed = parseTableFormData(formData);

  if (!parsed.success) {
    return {
      fieldErrors: parsed.fieldErrors,
      values: parsed.values,
    };
  }

  const values = toFormValues(parsed.data);

  try {
    const eventUser = await requireAdmin();
    const table = await createTableForEvent(eventUser, parsed.data);
    revalidateTablePaths(table.id);
    return { success: true, table };
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error;
    }

    return mapActionError(error, values);
  }
}

export async function updateTableAction(
  tableId: string,
  _prevState: TableFormState,
  formData: FormData,
): Promise<TableFormState> {
  const parsed = parseTableFormData(formData);

  if (!parsed.success) {
    return {
      fieldErrors: parsed.fieldErrors,
      values: parsed.values,
    };
  }

  const values = toFormValues(parsed.data);

  try {
    const eventUser = await requireAdmin();
    const table = await updateTableForEvent(eventUser, tableId, parsed.data);
    revalidateTablePaths(tableId);
    return { success: true, table };
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error;
    }

    return mapActionError(error, values);
  }
}

export async function deleteTableAction(
  tableId: string,
  _prevState: { error?: string } = {},
): Promise<{ error?: string }> {
  void _prevState;
  try {
    const eventUser = await requireAdmin();
    await deleteTableForEvent(eventUser, tableId);
    revalidateTablePaths(tableId);
    redirect("/admin/tables?deleted=1");
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error;
    }

    if (error instanceof TableError) {
      return { error: error.message };
    }

    if (error instanceof AuthError) {
      return { error: error.message };
    }

    return {
      error: "La suppression a échoué. Vérifiez votre connexion puis réessayez.",
    };
  }
}

export async function bulkDeleteTablesAction(tableIds: string[]): Promise<{ success?: boolean; tableIds?: string[]; error?: string }> {
  try { const eventUser = await requireAdmin(); const ids = await deleteTablesForEvent(eventUser, tableIds); revalidateTablePaths(); return { success: true, tableIds: ids }; }
  catch (error) { return { error: error instanceof TableError || error instanceof AuthError ? error.message : "La suppression groupée a échoué." }; }
}
