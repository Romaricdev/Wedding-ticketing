import { z } from "zod";

export const tableLabelSchema = z
  .string()
  .trim()
  .min(1, "Le nom ou numéro de table est obligatoire.")
  .max(80, "Le nom ou numéro ne peut pas dépasser 80 caractères.");

export const tableCapacitySchema = z.coerce
  .number({
    error: "La capacité doit être un nombre entier.",
  })
  .int("La capacité doit être un nombre entier.")
  .positive("La capacité doit être supérieure à 0.")
  .max(200, "La capacité ne peut pas dépasser 200 personnes.");

export const tableFormSchema = z.object({
  label: tableLabelSchema,
  capacity: tableCapacitySchema,
});

export type TableFormInput = z.infer<typeof tableFormSchema>;

export function parseTableFormData(formData: FormData):
  | { success: true; data: TableFormInput }
  | {
      success: false;
      fieldErrors: Partial<Record<"label" | "capacity", string>>;
      values: { label: string; capacity: string };
    } {
  const values = {
    label: String(formData.get("label") ?? ""),
    capacity: String(formData.get("capacity") ?? ""),
  };

  const parsed = tableFormSchema.safeParse(values);

  if (!parsed.success) {
    const fieldErrors: Partial<Record<"label" | "capacity", string>> = {};

    for (const issue of parsed.error.issues) {
      const field = issue.path[0];

      if (field === "label" || field === "capacity") {
        fieldErrors[field] = issue.message;
      }
    }

    return { success: false, fieldErrors, values };
  }

  return { success: true, data: parsed.data };
}
