import { PDFDocument } from "pdf-lib";

import { prisma } from "@/lib/prisma";
import { downloadPrivatePdf } from "@/server/tickets/storage";
import type { TicketTemplateRecord } from "@/types/templates";

export async function getActiveTicketTemplateForEvent(eventId: string): Promise<TicketTemplateRecord | null> {
  const template = await prisma.ticketTemplate.findFirst({
    where: { eventId, isActive: true },
    orderBy: { createdAt: "desc" },
  });
  if (!template) return null;
  const pdfBytes = await downloadPrivatePdf({
    bucket: template.storageBucket,
    path: template.storagePath,
  });
  const pdfDocument = await PDFDocument.load(pdfBytes);
  const page = pdfDocument.getPage(template.pageNumber - 1);
  const { width: pageWidth, height: pageHeight } = page.getSize();
  return {
    id: template.id,
    originalFilename: template.originalFilename,
    pageNumber: template.pageNumber,
    qrX: Number(template.qrX),
    qrY: Number(template.qrY),
    qrSize: Number(template.qrSize),
    pageWidth,
    pageHeight,
    createdAt: template.createdAt.toISOString(),
    // L'aperçu est servi par une route applicative protégée : certains
    // navigateurs interrompent les téléchargements PDF directs depuis Storage.
    previewUrl: `/api/templates/active-preview?v=${template.id}`,
  };
}
