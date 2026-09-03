import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";

describe("ConfirmDialog", () => {
  it("expose un dialogue accessible avec titre et actions", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <ConfirmDialog
        open
        title="Révoquer le billet"
        description="Cette action invalidera définitivement le QR actuel."
        confirmLabel="Révoquer"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Révoquer le billet" })).toBeInTheDocument();
    expect(
      screen.getByText("Cette action invalidera définitivement le QR actuel."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Révoquer" }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });
});
