import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const schemaPath = resolve(process.cwd(), "prisma/schema.prisma");
const schema = readFileSync(schemaPath, "utf8");

const expectedModels = [
  "Event",
  "EventUser",
  "DiningTable",
  "Guest",
  "TicketTemplate",
  "Ticket",
  "TicketGuest",
  "CheckInAttempt",
  "AuditLog",
];

const expectedEnums = [
  "EventStatus",
  "EventRole",
  "GuestStatus",
  "TicketType",
  "TicketStatus",
  "CheckInResult",
  "AuditAction",
];

describe("schéma Prisma Phase 1", () => {
  it("contient tous les modèles métier attendus", () => {
    for (const model of expectedModels) {
      expect(schema).toMatch(new RegExp(`model ${model}\\s*\\{`));
    }
  });

  it("contient tous les enums attendus", () => {
    for (const enumName of expectedEnums) {
      expect(schema).toMatch(new RegExp(`enum ${enumName}\\s*\\{`));
    }
  });

  it("mappe les tables en snake_case PostgreSQL", () => {
    expect(schema).toContain('@@map("event_users")');
    expect(schema).toContain('@@map("dining_tables")');
    expect(schema).toContain('@@map("check_in_attempts")');
  });
});
