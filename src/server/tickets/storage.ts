import { createServiceClient } from "@/lib/supabase/admin";
import { TICKET_PDFS_BUCKET, TICKET_TEMPLATES_BUCKET } from "@/types/tickets";

async function ensurePrivateBucket(bucket: string): Promise<void> {
  const supabase = createServiceClient();
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();

  if (listError) {
    throw new Error("Impossible de vérifier les buckets Storage.");
  }

  const existing = buckets?.find((item) => item.name === bucket);
  if (existing) {
    if (existing.public) {
      await supabase.storage.updateBucket(bucket, { public: false });
    }
    return;
  }

  const { error } = await supabase.storage.createBucket(bucket, {
    public: false,
    fileSizeLimit: 20 * 1024 * 1024,
    allowedMimeTypes: ["application/pdf"],
  });

  if (error && !error.message.toLowerCase().includes("already exists")) {
    throw new Error(`Impossible de créer le bucket ${bucket}.`);
  }
}

export async function ensureTicketStorageBuckets(): Promise<void> {
  await ensurePrivateBucket(TICKET_TEMPLATES_BUCKET);
  await ensurePrivateBucket(TICKET_PDFS_BUCKET);
}

export async function uploadPrivatePdf(params: {
  bucket: string;
  path: string;
  bytes: Uint8Array;
  upsert?: boolean;
}): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase.storage.from(params.bucket).upload(params.path, params.bytes, {
    contentType: "application/pdf",
    upsert: params.upsert ?? true,
  });

  if (error) {
    throw new Error("Échec du dépôt du PDF dans le stockage sécurisé.");
  }
}

export async function downloadPrivatePdf(params: {
  bucket: string;
  path: string;
}): Promise<Uint8Array> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.storage.from(params.bucket).download(params.path);

  if (error || !data) {
    throw new Error("Impossible de télécharger le fichier PDF depuis le stockage.");
  }

  return new Uint8Array(await data.arrayBuffer());
}

export async function createSignedPdfUrl(params: {
  bucket: string;
  path: string;
  expiresInSeconds?: number;
  download?: string;
}): Promise<string> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.storage
    .from(params.bucket)
    .createSignedUrl(
      params.path,
      params.expiresInSeconds ?? 120,
      params.download ? { download: params.download } : undefined,
    );

  if (error || !data?.signedUrl) {
    throw new Error("Impossible de générer le lien de téléchargement sécurisé.");
  }

  return data.signedUrl;
}

export function buildTemplateStoragePath(eventId: string, templateId: string): string {
  return `events/${eventId}/templates/${templateId}/source.pdf`;
}

export function buildTicketPdfStoragePath(eventId: string, ticketId: string, version: number): string {
  return `events/${eventId}/tickets/${ticketId}/v${version}.pdf`;
}
