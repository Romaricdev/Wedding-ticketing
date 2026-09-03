import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("affiche le libellé et gère le clic", () => {
    const onClick = vi.fn();

    render(<Button onClick={onClick}>Enregistrer</Button>);

    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it("désactive le bouton en état loading", () => {
    render(
      <Button loading aria-label="Chargement">
        Enregistrer
      </Button>,
    );

    expect(screen.getByRole("button", { name: "Chargement" })).toBeDisabled();
    expect(screen.getByRole("button")).toHaveAttribute("aria-busy", "true");
  });

  it("applique la variante danger", () => {
    render(<Button variant="danger">Supprimer</Button>);

    expect(screen.getByRole("button", { name: "Supprimer" })).toHaveClass("bg-danger");
  });
});
