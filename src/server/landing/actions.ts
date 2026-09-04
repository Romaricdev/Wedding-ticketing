"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { LandingContent } from "@/lib/landing-content";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/server/auth";

const text = z
  .string()
  .trim()
  .min(1, "Tous les textes doivent être renseignés.")
  .max(1400, "Le texte est trop long.");
const moment = z.object({
  time: text.max(40),
  day: text.max(100),
  title: text.max(160),
  text: text.max(500),
});
const landingContentSchema = z.object({
  monogram: text.max(20),
  navMessage: text.max(50),
  navProgram: text.max(50),
  navInfo: text.max(50),
  navGallery: text.max(50),
  accessLabel: text.max(60),
  loaderName: text.max(100),
  loaderMessage: text.max(120),
  loaderDate: text.max(60),
  heroEyebrow: text.max(100),
  heroFirstName: text.max(80),
  heroSecondName: text.max(80),
  heroDate: text.max(80),
  heroDescription: text.max(700),
  heroCta: text.max(80),
  countdownEyebrow: text.max(100),
  countdownTitle: text.max(180),
  countdownNote: text.max(200),
  countdownDays: text.max(30),
  countdownHours: text.max(30),
  countdownMinutes: text.max(30),
  countdownSeconds: text.max(30),
  programDate: text.max(80),
  programTitle: text.max(100),
  programAccent: text.max(100),
  programDescription: text.max(500),
  moments: z
    .array(moment)
    .min(1, "Ajoutez au moins une étape au programme.")
    .max(20, "Le programme est limité à 20 étapes."),
  infoEyebrow: text.max(100),
  infoTitle: text.max(120),
  infoDescription: text.max(500),
  fridayLabel: text.max(80),
  fridayTitle: text.max(100),
  saturdayLabel: text.max(80),
  saturdayTitle: text.max(100),
  ticketLabel: text.max(80),
  ticketTitle: text.max(100),
  ticketDescription: text.max(500),
  ticketCta: text.max(100),
  messageEyebrow: text.max(100),
  messageTitle: text.max(140),
  messageAccent: text.max(140),
  messageDescription: text.max(700),
  signature: text.max(120),
  footerText: text.max(160),
});

export async function updateLandingContentAction(
  content: LandingContent,
): Promise<{ error?: string }> {
  const parsed = landingContentSchema.safeParse(content);
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Le contenu est invalide." };
  try {
    const admin = await requireAdmin();
    await prisma.event.update({
      where: { id: admin.eventId },
      data: { landingContent: parsed.data },
    });
    revalidatePath("/");
    revalidatePath("/admin/parametres");
    return {};
  } catch {
    return { error: "Le contenu de la page d’accueil n’a pas pu être enregistré." };
  }
}
