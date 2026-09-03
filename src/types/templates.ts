export interface TicketTemplateRecord {
  id: string;
  originalFilename: string;
  pageNumber: number;
  qrX: number;
  qrY: number;
  qrSize: number;
  pageWidth: number;
  pageHeight: number;
  createdAt: string;
  previewUrl: string | null;
}
