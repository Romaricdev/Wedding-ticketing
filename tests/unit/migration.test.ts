import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const migrationPath = resolve(
  process.cwd(),
  "prisma/migrations/20250902170000_init/migration.sql",
);
const migration = readFileSync(migrationPath, "utf8");

describe("migration init PostgreSQL", () => {
  it("contient la migration versionnée init", () => {
    expect(migration).toContain('CREATE TYPE "EventRole" AS ENUM');
    expect(migration).toContain('CREATE TABLE "events"');
    expect(migration).toContain('CREATE TABLE "audit_logs"');
  });

  it("active RLS sur les tables métier", () => {
    expect(migration).toContain('ALTER TABLE "events" ENABLE ROW LEVEL SECURITY');
    expect(migration).toContain('ALTER TABLE "tickets" ENABLE ROW LEVEL SECURITY');
  });

  it("contient les index partiels critiques", () => {
    expect(migration).toContain("ticket_templates_one_active_per_event");
    expect(migration).toContain("check_in_one_accepted_per_ticket");
  });

  it("contient la contrainte composite event/table pour les invités", () => {
    expect(migration).toContain("guests_event_id_table_id_fkey");
    expect(migration).toContain("dining_tables_event_id_id_key");
  });
});
