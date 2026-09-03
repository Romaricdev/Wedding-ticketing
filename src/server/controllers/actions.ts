"use server";

import { AuditAction, EventRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createServiceClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/server/auth";

const createSchema = z.object({ displayName: z.string().trim().min(2, "Le nom affiché est requis.").max(120), email: z.string().trim().email("Adresse e-mail invalide."), password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères.").max(72) });
const idSchema = z.string().uuid();
const passwordSchema = z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères.").max(72);
function refresh() { revalidatePath("/admin/controleurs"); revalidatePath("/admin"); }

export async function createControllerAction(formData: FormData): Promise<{ error?: string }> {
  const parsed = createSchema.safeParse({ displayName: formData.get("displayName"), email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Informations invalides." };
  try {
    const admin = await requireAdmin(); const supabase = createServiceClient();
    const { data, error } = await supabase.auth.admin.createUser({ email: parsed.data.email.toLowerCase(), password: parsed.data.password, email_confirm: true });
    if (error || !data.user) return { error: error?.message.includes("already") ? "Cette adresse e-mail est déjà utilisée." : "Le compte Auth n’a pas pu être créé." };
    try { await prisma.$transaction(async (tx) => { const controller = await tx.eventUser.create({ data: { eventId: admin.eventId, authUserId: data.user.id, displayName: parsed.data.displayName, role: EventRole.CONTROLLER } }); await tx.auditLog.create({ data: { eventId: admin.eventId, actorUserId: admin.id, action: AuditAction.CONTROLLER_CREATED, entityType: "event_user", entityId: controller.id, afterData: { displayName: parsed.data.displayName } } }); }); }
    catch { await supabase.auth.admin.deleteUser(data.user.id); return { error: "Le profil contrôleur n’a pas pu être enregistré." }; }
    refresh(); return {};
  } catch { return { error: "La création du contrôleur a échoué." }; }
}

export async function setControllerActiveAction(id: string, isActive: boolean): Promise<{ error?: string }> {
  if (!idSchema.safeParse(id).success) return { error: "Contrôleur invalide." };
  try { const admin = await requireAdmin(); const controller = await prisma.eventUser.findFirst({ where: { id, eventId: admin.eventId, role: EventRole.CONTROLLER } }); if (!controller) return { error: "Contrôleur introuvable." }; await prisma.$transaction([prisma.eventUser.update({ where: { id }, data: { isActive } }), prisma.auditLog.create({ data: { eventId: admin.eventId, actorUserId: admin.id, action: AuditAction.CONTROLLER_DISABLED, entityType: "event_user", entityId: id, afterData: { isActive } } })]); refresh(); return {}; } catch { return { error: "La mise à jour a échoué." }; }
}

export async function resetControllerPasswordAction(id: string, password: string): Promise<{ error?: string }> {
  if (!idSchema.safeParse(id).success || !passwordSchema.safeParse(password).success) return { error: "Le mot de passe doit contenir au moins 8 caractères." };
  try { const admin = await requireAdmin(); const controller = await prisma.eventUser.findFirst({ where: { id, eventId: admin.eventId, role: EventRole.CONTROLLER } }); if (!controller) return { error: "Contrôleur introuvable." }; const { error } = await createServiceClient().auth.admin.updateUserById(controller.authUserId, { password }); if (error) return { error: "Le mot de passe n’a pas pu être mis à jour." }; await prisma.auditLog.create({ data: { eventId: admin.eventId, actorUserId: admin.id, action: AuditAction.EVENT_UPDATED, entityType: "event_user", entityId: id, afterData: { operation: "CONTROLLER_PASSWORD_RESET" } } }); return {}; } catch { return { error: "La réinitialisation a échoué." }; }
}
