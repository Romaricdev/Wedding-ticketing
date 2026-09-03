"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/auth";
import { replaceTicketTemplateForEvent, updateActiveTicketTemplateLayoutForEvent } from "@/server/templates/mutations";
import { parseTemplateLayout, parseTemplateUpload } from "@/server/templates/validation";
import type { TicketTemplateRecord } from "@/types/templates";

type TemplateActionResult = { success?: boolean; template?: TicketTemplateRecord; error?: string };
function revalidateTemplatePaths() { revalidatePath("/admin/parametres"); revalidatePath("/admin/billets"); }

export async function uploadTicketTemplateAction(formData: FormData): Promise<TemplateActionResult> {
  const parsed = await parseTemplateUpload(formData);
  if (!parsed.success) return { error: parsed.error };
  try {
    const eventUser = await requireAdmin();
    const template = await replaceTicketTemplateForEvent(eventUser, { ...parsed.data, originalFilename: parsed.file.name, bytes: parsed.bytes });
    revalidateTemplatePaths();
    return { success: true, template };
  } catch { return { error: "L'import du template a échoué. Vérifiez le stockage puis réessayez." }; }
}

export async function updateTicketTemplateLayoutAction(formData: FormData): Promise<TemplateActionResult> {
  const parsed = parseTemplateLayout(formData);
  if (!parsed.success) return { error: parsed.error };
  try {
    const eventUser = await requireAdmin();
    const template = await updateActiveTicketTemplateLayoutForEvent(eventUser, parsed.data);
    revalidateTemplatePaths();
    return { success: true, template };
  } catch { return { error: "La position du QR n'a pas pu être enregistrée." }; }
}
