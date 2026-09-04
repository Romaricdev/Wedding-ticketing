-- Galerie photos publique, administrée par événement. Les fichiers restent dans
-- un bucket privé et sont servis uniquement au travers d'URLs signées courtes.
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'GALLERY_PHOTO_UPLOADED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'GALLERY_PHOTO_DELETED';

CREATE TABLE "gallery_photos" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "event_id" UUID NOT NULL,
  "storage_bucket" VARCHAR(80) NOT NULL,
  "storage_path" TEXT NOT NULL,
  "original_filename" VARCHAR(255) NOT NULL,
  "mime_type" VARCHAR(100) NOT NULL,
  "byte_size" INTEGER NOT NULL,
  "caption" VARCHAR(240),
  "is_published" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "gallery_photos_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "gallery_photos_event_id_fkey"
    FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT,
  CONSTRAINT "gallery_photos_byte_size_check" CHECK ("byte_size" > 0)
);

CREATE INDEX "gallery_photos_event_id_published_created_at_idx"
  ON "gallery_photos"("event_id", "is_published", "created_at" DESC);
