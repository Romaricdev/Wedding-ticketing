import { describe, expect, it } from "vitest";

import { parseTableFormData, tableFormSchema } from "@/server/tables/validation";

describe("validation tables", () => {
  it("accepte un formulaire valide", () => {
    const parsed = tableFormSchema.safeParse({ label: "Table 12", capacity: "8" });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).toEqual({ label: "Table 12", capacity: 8 });
    }
  });

  it("rejette un nom vide", () => {
    const parsed = tableFormSchema.safeParse({ label: "   ", capacity: "8" });

    expect(parsed.success).toBe(false);
  });

  it("rejette une capacité non positive", () => {
    const parsed = tableFormSchema.safeParse({ label: "Table 1", capacity: "0" });

    expect(parsed.success).toBe(false);
  });

  it("parse FormData avec erreurs par champ", () => {
    const formData = new FormData();
    formData.set("label", "");
    formData.set("capacity", "-1");

    const parsed = parseTableFormData(formData);

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.fieldErrors.label).toBeTruthy();
      expect(parsed.fieldErrors.capacity).toBeTruthy();
    }
  });
});
