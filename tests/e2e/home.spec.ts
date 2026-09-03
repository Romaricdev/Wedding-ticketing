import { test, expect } from "@playwright/test";

test("page d'accueil technique affiche le nom du projet", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Billetterie mariage" })).toBeVisible();
  await expect(page.getByText("Environnement initialisé")).toBeVisible();
  await expect(page.getByText("Phase 0")).toBeVisible();
});
