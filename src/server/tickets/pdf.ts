import { PDFDocument, rgb } from "pdf-lib";
import QRCode from "qrcode";

import { getQrPayload } from "@/server/tickets/qr";
import {
  buildTicketPdfStoragePath,
  downloadPrivatePdf,
  ensureTicketStorageBuckets,
  uploadPrivatePdf,
} from "@/server/tickets/storage";
import { TICKET_PDFS_BUCKET } from "@/types/tickets";

export type TicketPdfLayout = {
  pageNumber: number;
  qrX: number;
  qrY: number;
  qrSize: number;
};

export async function generateTicketPdfBytes(params: {
  templateBytes: Uint8Array;
  token: string;
  layout: TicketPdfLayout;
}): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(params.templateBytes);
  const pages = pdfDoc.getPages();
  const pageIndex = Math.max(0, params.layout.pageNumber - 1);
  const page = pages[pageIndex];

  if (!page) {
    throw new Error("La page du template PDF est introuvable.");
  }

  const qrPayload = getQrPayload(params.token);
  const qrPng = await QRCode.toBuffer(qrPayload, {
    errorCorrectionLevel: "M",
    margin: 1,
    color: { dark: "#000000", light: "#FFFFFF" },
    width: 512,
    type: "png",
  });

  const qrImage = await pdfDoc.embedPng(qrPng);
  const size = params.layout.qrSize;
  const padding = Math.max(4, size * 0.06);

  page.drawRectangle({
    x: params.layout.qrX - padding,
    y: params.layout.qrY - padding,
    width: size + padding * 2,
    height: size + padding * 2,
    color: rgb(1, 1, 1),
  });

  page.drawImage(qrImage, {
    x: params.layout.qrX,
    y: params.layout.qrY,
    width: size,
    height: size,
  });

  return pdfDoc.save();
}

export async function renderAndStoreTicketPdf(params: {
  eventId: string;
  ticketId: string;
  version: number;
  token: string;
  templateBucket: string;
  templatePath: string;
  layout: TicketPdfLayout;
}): Promise<{ bucket: string; path: string }> {
  await ensureTicketStorageBuckets();
  const templateBytes = await downloadPrivatePdf({
    bucket: params.templateBucket,
    path: params.templatePath,
  });

  const pdfBytes = await generateTicketPdfBytes({
    templateBytes,
    token: params.token,
    layout: params.layout,
  });

  const path = buildTicketPdfStoragePath(params.eventId, params.ticketId, params.version);
  await uploadPrivatePdf({
    bucket: TICKET_PDFS_BUCKET,
    path,
    bytes: pdfBytes,
    upsert: true,
  });

  return { bucket: TICKET_PDFS_BUCKET, path };
}

/** Génère un PDF de démonstration neutre (fond invitation) pour le seed. */
export async function createBlankInvitationTemplatePdf(): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();

  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: rgb(0.98, 0.96, 0.93),
  });

  page.drawRectangle({
    x: 36,
    y: 36,
    width: width - 72,
    height: height - 72,
    borderColor: rgb(0.72, 0.62, 0.48),
    borderWidth: 1.5,
  });

  page.drawRectangle({
    x: 360,
    y: 560,
    width: 180,
    height: 220,
    borderColor: rgb(0.72, 0.62, 0.48),
    borderWidth: 1,
    color: rgb(1, 1, 1),
  });

  return pdfDoc.save();
}
