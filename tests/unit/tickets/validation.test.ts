import { TicketType } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { seatsForTicketType } from "@/lib/tickets";
import { createTicketSchema, parseCreateTicketFormData } from "@/server/tickets/validation";

describe("tickets/validation", () => {
  it("accepte un Single valide", () => {
    const parsed = createTicketSchema.safeParse({
      type: TicketType.SINGLE,
      guestId: "11111111-1111-4111-8111-111111111111",
      tableId: "22222222-2222-4222-8222-222222222222",
    });
    expect(parsed.success).toBe(true);
  });

  it("refuse un Couple avec le même invité deux fois", () => {
    const id = "11111111-1111-4111-8111-111111111111";
    const parsed = createTicketSchema.safeParse({
      type: TicketType.COUPLE,
      guestId1: id,
      guestId2: id,
      tableId: "22222222-2222-4222-8222-222222222222",
    });
    expect(parsed.success).toBe(false);
  });

  it("parse le FormData Couple", () => {
    const formData = new FormData();
    formData.set("type", TicketType.COUPLE);
    formData.set("guestId1", "11111111-1111-4111-8111-111111111111");
    formData.set("guestId2", "33333333-3333-4333-8333-333333333333");
    formData.set("tableId", "22222222-2222-4222-8222-222222222222");

    const parsed = parseCreateTicketFormData(formData);
    expect(parsed.success).toBe(true);
  });

  it("calcule les places Single/Couple", () => {
    expect(seatsForTicketType(TicketType.SINGLE)).toBe(1);
    expect(seatsForTicketType(TicketType.COUPLE)).toBe(2);
  });
});
