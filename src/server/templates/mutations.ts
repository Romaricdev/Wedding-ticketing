import { randomUUID } from "node:crypto";
import { AuditAction, Prisma } from "@prisma/client";
import { PDFDocument } from "pdf-lib";

import { prisma } from "@/lib/prisma";
import { getActiveTicketTemplateForEvent } from "@/server/templates/queries";
import type { TemplateLayoutInput } from "@/server/templates/validation";
import { buildTemplateStoragePath, downloadPrivatePdf, ensureTicketStorageBuckets, uploadPrivatePdf } from "@/server/tickets/storage";
import type { AuthenticatedEventUser } from "@/types/auth";
import { TICKET_TEMPLATES_BUCKET } from "@/types/tickets";
import type { TicketTemplateRecord } from "@/types/templates";

async function writeTemplateAudit(tx: Prisma.TransactionClient, eventUser: AuthenticatedEventUser, entityId: string, afterData: Prisma.InputJsonValue) {
  await tx.auditLog.create({
    data: { eventId: eventUser.eventId, actorUserId: eventUser.id, action: AuditAction.EVENT_UPDATED, entityType: "ticket_template", entityId, afterData },
  });
}

async function assertLayoutFitsPdf(bytes: Uint8Array, layout: TemplateLayoutInput): Promise<void> {
  const document = await PDFDocument.load(bytes);
  if (layout.pageNumber > document.getPageCount()) {
    throw new Error("La page configurée n'existe pas dans ce PDF.");
  }
  const { width, height } = document.getPage(layout.pageNumber - 1).getSize();
  if (layout.qrX + layout.qrSize > width || layout.qrY + layout.qrSize > height) {
    throw new Error("La zone QR doit rester entièrement dans la page du template.");
  }
}

export async function replaceTicketTemplateForEvent(eventUser: AuthenticatedEventUser, params: TemplateLayoutInput & { originalFilename: string; bytes: Uint8Array }): Promise<TicketTemplateRecord> {
  const templateId = randomUUID();
  const storagePath = buildTemplateStoragePath(eventUser.eventId, templateId);
  await assertLayoutFitsPdf(params.bytes, params);
  await ensureTicketStorageBuckets();
  await uploadPrivatePdf({ bucket: TICKET_TEMPLATES_BUCKET, path: storagePath, bytes: params.bytes, upsert: false });
  await prisma.$transaction(async (tx) => {
    await tx.ticketTemplate.updateMany({ where: { eventId: eventUser.eventId, isActive: true }, data: { isActive: false } });
    await tx.ticketTemplate.create({
      data: { id: templateId, eventId: eventUser.eventId, storageBucket: TICKET_TEMPLATES_BUCKET, storagePath, originalFilename: params.originalFilename.slice(0, 255), pageNumber: params.pageNumber, qrX: params.qrX, qrY: params.qrY, qrSize: params.qrSize, isActive: true, createdByUserId: eventUser.id },
    });
    await writeTemplateAudit(tx, eventUser, templateId, { operation: "TEMPLATE_REPLACED", filename: params.originalFilename, pageNumber: params.pageNumber, qrX: params.qrX, qrY: params.qrY, qrSize: params.qrSize });
  });
  const template = await getActiveTicketTemplateForEvent(eventUser.eventId);
  if (!template) throw new Error("Le template actif est introuvable après l'import.");
  return template;
}

export async function updateActiveTicketTemplateLayoutForEvent(eventUser: AuthenticatedEventUser, layout: TemplateLayoutInput): Promise<TicketTemplateRecord> {
  const existing = await prisma.ticketTemplate.findFirst({ where: { eventId: eventUser.eventId, isActive: true }, select: { id: true, storageBucket: true, storagePath: true } });
  if (!existing) throw new Error("Aucun template actif à configurer.");
  const bytes = await downloadPrivatePdf({ bucket: existing.storageBucket, path: existing.storagePath });
  await assertLayoutFitsPdf(bytes, layout);
  await prisma.$transaction(async (tx) => {
    await tx.ticketTemplate.update({ where: { id: existing.id }, data: layout });
    await writeTemplateAudit(tx, eventUser, existing.id, { operation: "TEMPLATE_QR_LAYOUT_UPDATED", ...layout });
  });
  const template = await getActiveTicketTemplateForEvent(eventUser.eventId);
  if (!template) throw new Error("Le template actif est introuvable.");
  return template;
}
