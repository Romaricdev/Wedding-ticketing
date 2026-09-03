"use server";

import { revalidatePath } from "next/cache";
import { TicketType } from "@prisma/client";

import { AuthError } from "@/types/auth";
import {
  DATABASE_UNAVAILABLE_MESSAGE,
  isDatabaseConnectionError,
} from "@/lib/database-errors";
import { requireAdmin } from "@/server/auth";
import { TicketError } from "@/server/tickets/errors";
import {
  cancelTicketForEvent,
  bulkCancelTicketsForEvent,
  bulkRegenerateTicketPdfsForEvent,
  createCoupleTicketForEvent,
  createSingleTicketForEvent,
  getTicketDownloadUrlForEvent,
  regenerateTicketPdfForEvent,
} from "@/server/tickets/mutations";
import {
  getActiveTemplateForEvent,
  getAvailableTablesForTicket,
  getEligibleGuestsForTicket,
  listTicketsForEvent,
} from "@/server/tickets/queries";
import {
  parseCancelTicketFormData,
  parseCreateTicketFormData,
} from "@/server/tickets/validation";
import type {
  AvailableTableOption,
  EligibleGuestOption,
  TicketRecord,
} from "@/types/tickets";

export type TicketFormState = {
  success?: boolean;
  ticket?: TicketRecord;
  error?: string;
  fieldErrors?: Partial<
    Record<"type" | "guestId" | "guestId1" | "guestId2" | "tableId", string>
  >;
  values?: Record<string, string>;
};

export type TicketCancelState = {
  success?: boolean;
  ticket?: TicketRecord;
  error?: string;
  fieldErrors?: Partial<Record<"reason", string>>;
};

export type TicketDownloadState = {
  success?: boolean;
  url?: string;
  filename?: string;
  error?: string;
};

function revalidateTicketPaths() {
  revalidatePath("/admin/billets");
  revalidatePath("/admin");
  revalidatePath("/admin/tables");
  revalidatePath("/admin/invites");
}

function mapTicketError(error: unknown): string {
  if (error instanceof TicketError || error instanceof AuthError) {
    return error.message;
  }
  if (isDatabaseConnectionError(error)) {
    return DATABASE_UNAVAILABLE_MESSAGE;
  }
  return "L'opération a échoué côté serveur. Réessayez dans quelques secondes.";
}

export async function createTicketAction(
  _prevState: TicketFormState,
  formData: FormData,
): Promise<TicketFormState> {
  const parsed = parseCreateTicketFormData(formData);

  if (!parsed.success) {
    return {
      fieldErrors: parsed.fieldErrors,
      values: parsed.values,
    };
  }

  try {
    const eventUser = await requireAdmin();
    const ticket =
      parsed.data.type === TicketType.SINGLE
        ? await createSingleTicketForEvent(eventUser, parsed.data)
        : await createCoupleTicketForEvent(eventUser, parsed.data);

    revalidateTicketPaths();
    return { success: true, ticket };
  } catch (error) {
    return {
      error: mapTicketError(error),
      fieldErrors: error instanceof TicketError ? error.fieldErrors : undefined,
      values: {
        type: parsed.data.type,
        guestId: parsed.data.type === TicketType.SINGLE ? parsed.data.guestId : "",
        guestId1: parsed.data.type === TicketType.COUPLE ? parsed.data.guestId1 : "",
        guestId2: parsed.data.type === TicketType.COUPLE ? parsed.data.guestId2 : "",
        tableId: parsed.data.tableId,
      },
    };
  }
}

export async function cancelTicketAction(
  ticketId: string,
  _prevState: TicketCancelState,
  formData: FormData,
): Promise<TicketCancelState> {
  const parsed = parseCancelTicketFormData(formData);
  if (!parsed.success) {
    return { fieldErrors: parsed.fieldErrors };
  }

  try {
    const eventUser = await requireAdmin();
    const ticket = await cancelTicketForEvent(eventUser, ticketId, parsed.data);
    revalidateTicketPaths();
    return { success: true, ticket };
  } catch (error) {
    return { error: mapTicketError(error) };
  }
}

export async function regenerateTicketPdfAction(
  ticketId: string,
): Promise<{ success?: boolean; ticket?: TicketRecord; error?: string }> {
  try {
    const eventUser = await requireAdmin();
    const ticket = await regenerateTicketPdfForEvent(eventUser, ticketId);
    revalidateTicketPaths();
    return { success: true, ticket };
  } catch (error) {
    return { error: mapTicketError(error) };
  }
}

export async function bulkCancelTicketsAction(ticketIds: string[]): Promise<{ tickets?: TicketRecord[]; error?: string }> {
  try {
    const eventUser = await requireAdmin();
    const tickets = await bulkCancelTicketsForEvent(eventUser, ticketIds);
    revalidateTicketPaths();
    return { tickets };
  } catch (error) {
    return { error: mapTicketError(error) };
  }
}

export async function bulkRegenerateTicketPdfsAction(ticketIds: string[]): Promise<{ tickets?: TicketRecord[]; error?: string }> {
  try {
    const eventUser = await requireAdmin();
    const tickets = await bulkRegenerateTicketPdfsForEvent(eventUser, ticketIds);
    revalidateTicketPaths();
    return { tickets };
  } catch (error) {
    return { error: mapTicketError(error) };
  }
}

export async function getTicketDownloadAction(
  ticketId: string,
): Promise<TicketDownloadState> {
  try {
    const eventUser = await requireAdmin();
    const result = await getTicketDownloadUrlForEvent(eventUser, ticketId);
    return { success: true, ...result };
  } catch (error) {
    return { error: mapTicketError(error) };
  }
}

export async function loadTicketWizardDataAction(requiredSeats: number): Promise<{
  guests: EligibleGuestOption[];
  tables: AvailableTableOption[];
  hasActiveTemplate: boolean;
  error?: string;
}> {
  try {
    const eventUser = await requireAdmin();
    const [guests, tables, template] = await Promise.all([
      getEligibleGuestsForTicket(eventUser.eventId),
      getAvailableTablesForTicket(eventUser.eventId, requiredSeats),
      getActiveTemplateForEvent(eventUser.eventId),
    ]);

    return {
      guests,
      tables,
      hasActiveTemplate: Boolean(template),
    };
  } catch (error) {
    return {
      guests: [],
      tables: [],
      hasActiveTemplate: false,
      error: mapTicketError(error),
    };
  }
}

export async function listTicketsAction(): Promise<{
  tickets?: TicketRecord[];
  error?: string;
}> {
  try {
    const eventUser = await requireAdmin();
    const tickets = await listTicketsForEvent(eventUser.eventId);
    return { tickets };
  } catch (error) {
    return { error: mapTicketError(error) };
  }
}
