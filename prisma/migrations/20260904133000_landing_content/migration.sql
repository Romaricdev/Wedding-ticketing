-- Contenu éditorial public, isolé par événement et administrable depuis le back-office.
ALTER TABLE "events"
  ADD COLUMN IF NOT EXISTS "landing_content" JSONB;
