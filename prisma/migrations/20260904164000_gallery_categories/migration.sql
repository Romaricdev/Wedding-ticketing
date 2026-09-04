CREATE TABLE "gallery_categories" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "event_id" UUID NOT NULL,
  "name" VARCHAR(100) NOT NULL,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "gallery_categories_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "gallery_categories_event_id_fkey"
    FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT
);

ALTER TABLE "gallery_photos"
  ADD COLUMN "category_id" UUID;

ALTER TABLE "gallery_photos"
  ADD CONSTRAINT "gallery_photos_category_id_fkey"
  FOREIGN KEY ("category_id") REFERENCES "gallery_categories"("id") ON DELETE SET NULL;

CREATE UNIQUE INDEX "gallery_categories_event_id_name_key"
  ON "gallery_categories"("event_id", "name");

CREATE INDEX "gallery_categories_event_id_sort_order_created_at_idx"
  ON "gallery_categories"("event_id", "sort_order", "created_at");

DROP INDEX "gallery_photos_event_id_published_created_at_idx";

CREATE INDEX "gallery_photos_event_id_category_published_created_at_idx"
  ON "gallery_photos"("event_id", "category_id", "is_published", "created_at" DESC);
