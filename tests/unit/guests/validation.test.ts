import { describe, expect, it } from "vitest";

import {
  parseGuestCsvText,
  parseGuestFormData,
  validateGuestCsvRows,
} from "@/server/guests/validation";

describe("validation guests", () => {
  it("accepte un formulaire valide", () => {
    const formData = new FormData();
    formData.set("lastName", "Dupont");
    formData.set("firstNames", "Marie");
    formData.set("notes", "VIP");

    const parsed = parseGuestFormData(formData);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).toEqual({
        lastName: "Dupont",
        firstNames: "Marie",
        notes: "VIP",
      });
    }
  });

  it("refuse un nom vide", () => {
    const formData = new FormData();
    formData.set("lastName", " ");
    formData.set("firstNames", "Marie");

    const parsed = parseGuestFormData(formData);
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.fieldErrors.lastName).toMatch(/obligatoire/i);
    }
  });

  it("parse un CSV avec en-têtes français", () => {
    const parsed = parseGuestCsvText("nom,prenoms,notes\nDupont,Marie,VIP\nMartin,Paul,");
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.rows).toHaveLength(2);
      expect(parsed.rows[0]).toMatchObject({
        lineNumber: 2,
        lastName: "Dupont",
        firstNames: "Marie",
        notes: "VIP",
      });
    }
  });

  it("parse un CSV avec en-têtes anglais", () => {
    const parsed = parseGuestCsvText("lastName,firstNames,notes\nSmith,John,");
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.rows[0]?.lastName).toBe("Smith");
    }
  });

  it("signale les lignes invalides et les doublons fichier", () => {
    const { validRows, invalidRows, warnings } = validateGuestCsvRows([
      { lineNumber: 2, lastName: "Dupont", firstNames: "Marie", notes: "" },
      { lineNumber: 3, lastName: "", firstNames: "Paul", notes: "" },
      { lineNumber: 4, lastName: "Dupont", firstNames: "Marie", notes: "copie" },
    ]);

    expect(validRows).toHaveLength(2);
    expect(invalidRows).toEqual([
      { lineNumber: 3, message: expect.stringMatching(/nom/i) },
    ]);
    expect(warnings.some((warning) => warning.lineNumber === 4)).toBe(true);
  });
});
