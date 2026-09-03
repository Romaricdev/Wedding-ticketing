import { TicketType } from "@prisma/client";
import { z } from "zod";

const uuidSchema = z.string().uuid("Identifiant invalide.");

export const createSingleTicketSchema = z.object({
  type: z.literal(TicketType.SINGLE),
  guestId: uuidSchema,
  tableId: uuidSchema,
});

export const createCoupleTicketSchema = z.object({
  type: z.literal(TicketType.COUPLE),
  guestId1: uuidSchema,
  guestId2: uuidSchema,
  tableId: uuidSchema,
}).superRefine((value, ctx) => {
  if (value.guestId1 === value.guestId2) {
    ctx.addIssue({
      code: "custom",
      path: ["guestId2"],
      message: "Les deux invités d'un Couple doivent être distincts.",
    });
  }
});

export const createTicketSchema = z.discriminatedUnion("type", [
  createSingleTicketSchema,
  createCoupleTicketSchema,
]);

export type CreateSingleTicketInput = z.infer<typeof createSingleTicketSchema>;
export type CreateCoupleTicketInput = z.infer<typeof createCoupleTicketSchema>;
export type CreateTicketInput = z.infer<typeof createTicketSchema>;

export const cancelTicketSchema = z.object({
  reason: z
    .string()
    .trim()
    .max(300, "Le motif ne peut pas dépasser 300 caractères.")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null)),
});

export type CancelTicketInput = z.infer<typeof cancelTicketSchema>;

export function parseCreateTicketFormData(formData: FormData):
  | { success: true; data: CreateTicketInput }
  | {
      success: false;
      fieldErrors: Partial<
        Record<"type" | "guestId" | "guestId1" | "guestId2" | "tableId", string>
      >;
      values: Record<string, string>;
    } {
  const type = String(formData.get("type") ?? "");
  const values: Record<string, string> = {
    type,
    guestId: String(formData.get("guestId") ?? ""),
    guestId1: String(formData.get("guestId1") ?? ""),
    guestId2: String(formData.get("guestId2") ?? ""),
    tableId: String(formData.get("tableId") ?? ""),
  };

  const payload =
    type === TicketType.COUPLE
      ? {
          type: TicketType.COUPLE,
          guestId1: values.guestId1,
          guestId2: values.guestId2,
          tableId: values.tableId,
        }
      : {
          type: TicketType.SINGLE,
          guestId: values.guestId,
          tableId: values.tableId,
        };

  const parsed = createTicketSchema.safeParse(payload);

  if (!parsed.success) {
    const fieldErrors: Partial<
      Record<"type" | "guestId" | "guestId1" | "guestId2" | "tableId", string>
    > = {};

    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (
        field === "type" ||
        field === "guestId" ||
        field === "guestId1" ||
        field === "guestId2" ||
        field === "tableId"
      ) {
        fieldErrors[field] = issue.message;
      }
    }

    if (!fieldErrors.type && type !== TicketType.SINGLE && type !== TicketType.COUPLE) {
      fieldErrors.type = "Choisissez Single ou Couple.";
    }

    return { success: false, fieldErrors, values };
  }

  return { success: true, data: parsed.data };
}

export function parseCancelTicketFormData(formData: FormData):
  | { success: true; data: CancelTicketInput }
  | { success: false; fieldErrors: Partial<Record<"reason", string>> } {
  const parsed = cancelTicketSchema.safeParse({
    reason: String(formData.get("reason") ?? ""),
  });

  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: {
        reason: parsed.error.issues[0]?.message ?? "Motif invalide.",
      },
    };
  }

  return { success: true, data: parsed.data };
}
