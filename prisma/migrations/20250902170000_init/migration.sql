-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "EventRole" AS ENUM ('ADMIN', 'CONTROLLER');

-- CreateEnum
CREATE TYPE "GuestStatus" AS ENUM ('ACTIVE', 'CANCELLED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TicketType" AS ENUM ('SINGLE', 'COUPLE');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('ACTIVE', 'USED', 'REVOKED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CheckInResult" AS ENUM ('ACCEPTED', 'MANUAL_ACCEPTED', 'ALREADY_USED', 'INVALID', 'REVOKED', 'CANCELLED', 'DENIED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('EVENT_UPDATED', 'TABLE_CREATED', 'TABLE_UPDATED', 'TABLE_DELETED', 'GUEST_CREATED', 'GUEST_UPDATED', 'GUEST_CANCELLED', 'TICKET_CREATED', 'TICKET_REISSUED', 'TICKET_REVOKED', 'TICKET_CANCELLED', 'CONTROLLER_CREATED', 'CONTROLLER_DISABLED', 'CHECK_IN_ACCEPTED', 'CHECK_IN_MANUAL_ACCEPTED');

-- CreateTable
CREATE TABLE "events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(160) NOT NULL,
    "wedding_date" TIMESTAMPTZ(6),
    "venue_name" VARCHAR(200),
    "timezone" VARCHAR(64) NOT NULL DEFAULT 'Africa/Douala',
    "status" "EventStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event_id" UUID NOT NULL,
    "auth_user_id" UUID NOT NULL,
    "display_name" VARCHAR(120) NOT NULL,
    "role" "EventRole" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "event_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dining_tables" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event_id" UUID NOT NULL,
    "label" VARCHAR(80) NOT NULL,
    "capacity" SMALLINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "dining_tables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event_id" UUID NOT NULL,
    "last_name" VARCHAR(120) NOT NULL,
    "first_names" VARCHAR(160) NOT NULL,
    "table_id" UUID,
    "status" "GuestStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "guests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_templates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event_id" UUID NOT NULL,
    "storage_bucket" VARCHAR(80) NOT NULL,
    "storage_path" TEXT NOT NULL,
    "original_filename" VARCHAR(255) NOT NULL,
    "page_number" SMALLINT NOT NULL DEFAULT 1,
    "qr_x" DECIMAL(10,2) NOT NULL,
    "qr_y" DECIMAL(10,2) NOT NULL,
    "qr_size" DECIMAL(10,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "created_by_user_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ticket_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event_id" UUID NOT NULL,
    "template_id" UUID,
    "short_code" VARCHAR(16) NOT NULL,
    "type" "TicketType" NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'ACTIVE',
    "token_hash" CHAR(64) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "issued_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checked_in_at" TIMESTAMPTZ(6),
    "checked_in_by_user_id" UUID,
    "revoked_at" TIMESTAMPTZ(6),
    "revoked_reason" VARCHAR(300),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_guests" (
    "ticket_id" UUID NOT NULL,
    "guest_id" UUID NOT NULL,
    "position" SMALLINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_guests_pkey" PRIMARY KEY ("ticket_id","guest_id")
);

-- CreateTable
CREATE TABLE "check_in_attempts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event_id" UUID NOT NULL,
    "ticket_id" UUID,
    "operator_user_id" UUID,
    "result" "CheckInResult" NOT NULL,
    "is_manual" BOOLEAN NOT NULL DEFAULT false,
    "manual_reason" VARCHAR(300),
    "scanned_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "device_label" VARCHAR(120),
    "unknown_token_hash" CHAR(64),
    "metadata" JSONB,

    CONSTRAINT "check_in_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event_id" UUID NOT NULL,
    "actor_user_id" UUID,
    "action" "AuditAction" NOT NULL,
    "entity_type" VARCHAR(80) NOT NULL,
    "entity_id" UUID,
    "before_data" JSONB,
    "after_data" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "events_status_idx" ON "events"("status");

-- CreateIndex
CREATE INDEX "event_users_event_id_role_is_active_idx" ON "event_users"("event_id", "role", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "event_users_event_id_auth_user_id_key" ON "event_users"("event_id", "auth_user_id");

-- CreateIndex
CREATE INDEX "dining_tables_event_id_label_idx" ON "dining_tables"("event_id", "label");

-- CreateIndex
CREATE UNIQUE INDEX "dining_tables_event_id_label_key" ON "dining_tables"("event_id", "label");

-- CreateIndex
CREATE UNIQUE INDEX "dining_tables_event_id_id_key" ON "dining_tables"("event_id", "id");

-- CreateIndex
CREATE INDEX "guests_event_id_status_table_id_idx" ON "guests"("event_id", "status", "table_id");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_token_hash_key" ON "tickets"("token_hash");

-- CreateIndex
CREATE INDEX "tickets_token_hash_status_checked_in_at_idx" ON "tickets"("token_hash", "status", "checked_in_at");

-- CreateIndex
CREATE INDEX "tickets_event_id_status_type_issued_at_idx" ON "tickets"("event_id", "status", "type", "issued_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "tickets_event_id_short_code_key" ON "tickets"("event_id", "short_code");

-- CreateIndex
CREATE INDEX "ticket_guests_guest_id_idx" ON "ticket_guests"("guest_id");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_guests_ticket_id_position_key" ON "ticket_guests"("ticket_id", "position");

-- CreateIndex
CREATE INDEX "check_in_attempts_event_id_scanned_at_idx" ON "check_in_attempts"("event_id", "scanned_at" DESC);

-- CreateIndex
CREATE INDEX "check_in_attempts_ticket_id_scanned_at_idx" ON "check_in_attempts"("ticket_id", "scanned_at" DESC);

-- CreateIndex
CREATE INDEX "check_in_attempts_operator_user_id_scanned_at_idx" ON "check_in_attempts"("operator_user_id", "scanned_at" DESC);

-- CreateIndex
CREATE INDEX "check_in_attempts_event_id_result_scanned_at_idx" ON "check_in_attempts"("event_id", "result", "scanned_at" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_event_id_created_at_idx" ON "audit_logs"("event_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_actor_user_id_created_at_idx" ON "audit_logs"("actor_user_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "event_users" ADD CONSTRAINT "event_users_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dining_tables" ADD CONSTRAINT "dining_tables_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guests" ADD CONSTRAINT "guests_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guests" ADD CONSTRAINT "guests_event_id_table_id_fkey" FOREIGN KEY ("event_id", "table_id") REFERENCES "dining_tables"("event_id", "id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_templates" ADD CONSTRAINT "ticket_templates_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_templates" ADD CONSTRAINT "ticket_templates_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "event_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "ticket_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_checked_in_by_user_id_fkey" FOREIGN KEY ("checked_in_by_user_id") REFERENCES "event_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_guests" ADD CONSTRAINT "ticket_guests_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_guests" ADD CONSTRAINT "ticket_guests_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "guests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "check_in_attempts" ADD CONSTRAINT "check_in_attempts_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "check_in_attempts" ADD CONSTRAINT "check_in_attempts_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "check_in_attempts" ADD CONSTRAINT "check_in_attempts_operator_user_id_fkey" FOREIGN KEY ("operator_user_id") REFERENCES "event_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "event_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Extensions, contraintes SQL complémentaires, index partiels, triggers, RLS
-- (non exprimables entièrement via Prisma — docs/SPECIFICATION_BASE_DE_DONNEES.md)
-- ---------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- dining_tables : capacité positive
ALTER TABLE "dining_tables"
  ADD CONSTRAINT "dining_tables_capacity_range_check"
  CHECK ("capacity" > 0 AND "capacity" <= 200);

-- guests : noms non vides
ALTER TABLE "guests"
  ADD CONSTRAINT "guests_last_name_not_blank_check"
  CHECK (length(trim("last_name")) > 0);

ALTER TABLE "guests"
  ADD CONSTRAINT "guests_first_names_not_blank_check"
  CHECK (length(trim("first_names")) > 0);

-- ticket_templates : contraintes QR
ALTER TABLE "ticket_templates"
  ADD CONSTRAINT "ticket_templates_page_number_check"
  CHECK ("page_number" >= 1);

ALTER TABLE "ticket_templates"
  ADD CONSTRAINT "ticket_templates_qr_x_check"
  CHECK ("qr_x" >= 0);

ALTER TABLE "ticket_templates"
  ADD CONSTRAINT "ticket_templates_qr_y_check"
  CHECK ("qr_y" >= 0);

ALTER TABLE "ticket_templates"
  ADD CONSTRAINT "ticket_templates_qr_size_check"
  CHECK ("qr_size" >= 70);

-- tickets : cohérence statut / dates
ALTER TABLE "tickets"
  ADD CONSTRAINT "tickets_version_check"
  CHECK ("version" >= 1);

ALTER TABLE "tickets"
  ADD CONSTRAINT "tickets_used_requires_checked_in_check"
  CHECK ("status" <> 'USED' OR "checked_in_at" IS NOT NULL);

ALTER TABLE "tickets"
  ADD CONSTRAINT "tickets_non_used_checked_in_null_check"
  CHECK ("status" IN ('ACTIVE', 'REVOKED', 'CANCELLED') OR "checked_in_at" IS NOT NULL);

ALTER TABLE "tickets"
  ADD CONSTRAINT "tickets_revoked_requires_revoked_at_check"
  CHECK ("status" <> 'REVOKED' OR "revoked_at" IS NOT NULL);

-- ticket_guests : position 1 ou 2
ALTER TABLE "ticket_guests"
  ADD CONSTRAINT "ticket_guests_position_check"
  CHECK ("position" IN (1, 2));

-- check_in_attempts : règles manuelles
ALTER TABLE "check_in_attempts"
  ADD CONSTRAINT "check_in_attempts_manual_reason_check"
  CHECK ("is_manual" = false OR ("manual_reason" IS NOT NULL AND length(trim("manual_reason")) > 0));

ALTER TABLE "check_in_attempts"
  ADD CONSTRAINT "check_in_attempts_manual_accepted_check"
  CHECK ("result" <> 'MANUAL_ACCEPTED' OR "is_manual" = true);

-- Index partiel : un seul template actif par événement
CREATE UNIQUE INDEX "ticket_templates_one_active_per_event"
  ON "ticket_templates" ("event_id")
  WHERE "is_active" = true;

-- Index partiel : une seule entrée acceptée par billet
CREATE UNIQUE INDEX "check_in_one_accepted_per_ticket"
  ON "check_in_attempts" ("ticket_id")
  WHERE "result" IN ('ACCEPTED', 'MANUAL_ACCEPTED');

-- Index recherche invités
CREATE INDEX "guests_event_id_lower_names_idx"
  ON "guests" ("event_id", lower("last_name"), lower("first_names"));

-- Trigger updated_at
CREATE OR REPLACE FUNCTION "set_updated_at"()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updated_at" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "events_set_updated_at"
  BEFORE UPDATE ON "events"
  FOR EACH ROW EXECUTE FUNCTION "set_updated_at"();

CREATE TRIGGER "event_users_set_updated_at"
  BEFORE UPDATE ON "event_users"
  FOR EACH ROW EXECUTE FUNCTION "set_updated_at"();

CREATE TRIGGER "dining_tables_set_updated_at"
  BEFORE UPDATE ON "dining_tables"
  FOR EACH ROW EXECUTE FUNCTION "set_updated_at"();

CREATE TRIGGER "guests_set_updated_at"
  BEFORE UPDATE ON "guests"
  FOR EACH ROW EXECUTE FUNCTION "set_updated_at"();

CREATE TRIGGER "ticket_templates_set_updated_at"
  BEFORE UPDATE ON "ticket_templates"
  FOR EACH ROW EXECUTE FUNCTION "set_updated_at"();

CREATE TRIGGER "tickets_set_updated_at"
  BEFORE UPDATE ON "tickets"
  FOR EACH ROW EXECUTE FUNCTION "set_updated_at"();

-- RLS : aucune politique permissive — accès métier via Prisma serveur uniquement
ALTER TABLE "events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "event_users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "dining_tables" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "guests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ticket_templates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tickets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ticket_guests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "check_in_attempts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;
