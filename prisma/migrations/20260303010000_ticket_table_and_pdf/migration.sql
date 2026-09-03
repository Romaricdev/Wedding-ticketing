-- Phase 5 : table obligatoire sur billet + métadonnées PDF
-- Aucun billet existant attendu en environnement de développement (seed sans tickets).

ALTER TABLE "tickets"
  ADD COLUMN IF NOT EXISTS "table_id" UUID,
  ADD COLUMN IF NOT EXISTS "pdf_storage_bucket" VARCHAR(80),
  ADD COLUMN IF NOT EXISTS "pdf_storage_path" TEXT,
  ADD COLUMN IF NOT EXISTS "pdf_generated_at" TIMESTAMPTZ(6),
  ADD COLUMN IF NOT EXISTS "pdf_error" VARCHAR(500);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "tickets" WHERE "table_id" IS NULL) THEN
    RAISE EXCEPTION 'Migration impossible : des billets existent sans table_id. Affectez une table avant de relancer.';
  END IF;
END $$;

ALTER TABLE "tickets"
  ALTER COLUMN "table_id" SET NOT NULL;

ALTER TABLE "tickets"
  DROP CONSTRAINT IF EXISTS "tickets_event_id_table_id_fkey";

ALTER TABLE "tickets"
  ADD CONSTRAINT "tickets_event_id_table_id_fkey"
  FOREIGN KEY ("event_id", "table_id")
  REFERENCES "dining_tables"("event_id", "id")
  ON DELETE RESTRICT
  ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "tickets_event_id_table_id_status_idx"
  ON "tickets"("event_id", "table_id", "status");
