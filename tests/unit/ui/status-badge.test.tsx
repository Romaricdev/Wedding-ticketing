import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StatusBadge } from "@/components/ui/status-badge";

describe("StatusBadge", () => {
  it("affiche un libellé explicite pour Single", () => {
    render(<StatusBadge status="single" />);

    expect(screen.getByText("Single - 1 personne")).toBeInTheDocument();
  });

  it("permet de surcharger le libellé", () => {
    render(<StatusBadge status="success" label="Entrée autorisée" />);

    expect(screen.getByText("Entrée autorisée")).toBeInTheDocument();
  });

  it("utilise la variante danger pour un billet révoqué", () => {
    render(<StatusBadge status="revoked" />);

    const badge = screen.getByText("Révoqué");
    expect(badge).toHaveClass("text-danger");
  });
});
