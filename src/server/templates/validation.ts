import { z } from "zod";

const layoutSchema = z.object({
  pageNumber: z.coerce.number().int().min(1, "La page doit être supérieure ou égale à 1.").max(50),
  qrX: z.coerce.number().min(0, "La position horizontale doit être positive.").max(2_000),
  qrY: z.coerce.number().min(0, "La position verticale doit être positive.").max(2_000),
  qrSize: z.coerce.number().min(70, "Le QR doit mesurer au moins 70 pt pour rester lisible.").max(500),
});

export type TemplateLayoutInput = z.infer<typeof layoutSchema>;

export function parseTemplateLayout(formData: FormData):
  | { success: true; data: TemplateLayoutInput }
  | { success: false; error: string } {
  const parsed = layoutSchema.safeParse({
    pageNumber: formData.get("pageNumber"),
    qrX: formData.get("qrX"),
    qrY: formData.get("qrY"),
    qrSize: formData.get("qrSize"),
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Configuration QR invalide." };
  }
  return { success: true, data: parsed.data };
}

export async function parseTemplateUpload(formData: FormData): Promise<
  | { success: true; data: TemplateLayoutInput; file: File; bytes: Uint8Array }
  | { success: false; error: string }
> {
  const layout = parseTemplateLayout(formData);
  if (!layout.success) return layout;
  const entry = formData.get("file");
  if (!(entry instanceof File) || entry.size === 0) {
    return { success: false, error: "Sélectionnez un fichier PDF." };
  }
  if (entry.size > 20 * 1024 * 1024) {
    return { success: false, error: "Le template ne doit pas dépasser 20 Mo." };
  }
  if (entry.type && entry.type !== "application/pdf" && !entry.name.toLowerCase().endsWith(".pdf")) {
    return { success: false, error: "Le template doit être un fichier PDF." };
  }
  const bytes = new Uint8Array(await entry.arrayBuffer());
  if (new TextDecoder().decode(bytes.subarray(0, 5)) !== "%PDF-") {
    return { success: false, error: "Le fichier sélectionné n'est pas un PDF valide." };
  }
  return { success: true, data: layout.data, file: entry, bytes };
}
