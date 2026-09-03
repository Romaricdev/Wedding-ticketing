import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";

describe("FormField", () => {
  it("associe label, aide et erreur au champ", () => {
    render(
      <FormField
        label="Nom"
        htmlFor="guest-name"
        help="Nom de famille tel qu'imprimé sur le billet."
        error="Le nom est obligatoire."
      >
        <Input id="guest-name" />
      </FormField>,
    );

    expect(screen.getByLabelText(/Nom/i)).toHaveAttribute("id", "guest-name");
    expect(screen.getByText("Nom de famille tel qu'imprimé sur le billet.")).toHaveAttribute(
      "id",
      "guest-name-help",
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Le nom est obligatoire.");
  });
});
