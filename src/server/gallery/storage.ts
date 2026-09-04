import { createServiceClient } from "@/lib/supabase/admin";
import { MAX_GALLERY_IMAGE_BYTES } from "@/server/gallery/image-optimizer";

export const EVENT_GALLERY_BUCKET = "event-gallery";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export function isAllowedGalleryImageType(
  value: string,
): value is (typeof ALLOWED_IMAGE_TYPES)[number] {
  return (ALLOWED_IMAGE_TYPES as readonly string[]).includes(value);
}

export async function ensureGalleryBucket(): Promise<void> {
  const supabase = createServiceClient();
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) throw new Error("Impossible de vérifier le stockage de la galerie.");

  const existing = buckets?.find((bucket) => bucket.name === EVENT_GALLERY_BUCKET);
  if (existing) {
    await supabase.storage.updateBucket(EVENT_GALLERY_BUCKET, {
      public: false,
      fileSizeLimit: MAX_GALLERY_IMAGE_BYTES,
      allowedMimeTypes: [...ALLOWED_IMAGE_TYPES],
    });
    return;
  }

  const { error } = await supabase.storage.createBucket(EVENT_GALLERY_BUCKET, {
    public: false,
    fileSizeLimit: MAX_GALLERY_IMAGE_BYTES,
    allowedMimeTypes: [...ALLOWED_IMAGE_TYPES],
  });
  if (error && !error.message.toLowerCase().includes("already exists")) {
    throw new Error("Impossible de créer le stockage de la galerie.");
  }
}

export async function uploadGalleryImage(params: {
  path: string;
  bytes: Uint8Array;
  mimeType: string;
}): Promise<void> {
  const { error } = await createServiceClient()
    .storage.from(EVENT_GALLERY_BUCKET)
    .upload(params.path, params.bytes, { contentType: params.mimeType, upsert: false });
  if (error) throw new Error("Échec de l’envoi de la photo dans la galerie.");
}

export async function removeGalleryImage(path: string): Promise<void> {
  const { error } = await createServiceClient()
    .storage.from(EVENT_GALLERY_BUCKET)
    .remove([path]);
  if (error) throw new Error("Impossible de supprimer le fichier de la galerie.");
}

export async function createGalleryImageUrl(params: {
  path: string;
  filename?: string;
}): Promise<string> {
  const { data, error } = await createServiceClient()
    .storage.from(EVENT_GALLERY_BUCKET)
    .createSignedUrl(
      params.path,
      60 * 60,
      params.filename ? { download: params.filename } : undefined,
    );
  if (error || !data?.signedUrl) throw new Error("Impossible de préparer la photo.");
  return data.signedUrl;
}

export function buildGalleryStoragePath(
  eventId: string,
  photoId: string,
  mimeType: string,
): string {
  const extension =
    mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg";
  return `events/${eventId}/gallery/${photoId}.${extension}`;
}
