"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/server/auth";

const schema = z.object({ eventName: z.string().trim().min(2, "Le nom de l’événement est requis.").max(160), venueName: z.string().trim().max(200), weddingDate: z.string().trim(), displayName: z.string().trim().min(2, "Le nom affiché est requis.").max(120) });

export async function updateProductionProfileAction(formData: FormData): Promise<{ error?: string }> {
  const parsed = schema.safeParse({ eventName: formData.get("eventName"), venueName: formData.get("venueName"), weddingDate: formData.get("weddingDate"), displayName: formData.get("displayName") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Informations invalides." };
  try {
    const user = await requireAdmin();
    const weddingDate = parsed.data.weddingDate ? new Date(`${parsed.data.weddingDate}T12:00:00.000Z`) : null;
    if (weddingDate && Number.isNaN(weddingDate.getTime())) return { error: "La date est invalide." };
    await prisma.$transaction([prisma.event.update({ where: { id: user.eventId }, data: { name: parsed.data.eventName, venueName: parsed.data.venueName || null, weddingDate } }), prisma.eventUser.update({ where: { id: user.id }, data: { displayName: parsed.data.displayName } })]);
    revalidatePath("/admin", "layout"); revalidatePath("/admin"); revalidatePath("/admin/parametres");
    return {};
  } catch { return { error: "La configuration n’a pas pu être enregistrée." }; }
}
