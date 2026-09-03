import { expect, test } from "@playwright/test";

const email = process.env.E2E_ADMIN_EMAIL?.trim() || process.env.SEED_ADMIN_EMAIL?.trim();
const password = process.env.E2E_ADMIN_PASSWORD?.trim() || process.env.SEED_ADMIN_PASSWORD?.trim();
const describeAdmin = email && password ? test.describe : test.describe.skip;

describeAdmin("Historique des contrôles — ADMIN", () => {
  test("affiche les filtres et l'état vide ou les contrôles", async ({ page }) => {
    await page.goto("/connexion");
    await page.locator("#email").fill(email!);
    await page.locator("#password").fill(password!);
    await page.getByRole("button", { name: /se connecter/i }).click();
    await page.waitForURL(/\/admin\/?$/, { timeout: 60_000 });

    await page.goto("/admin/historique");
    await expect(page.getByRole("heading", { name: "Historique des contrôles" })).toBeVisible();
    await expect(page.getByLabel("Rechercher dans l’historique")).toBeVisible();
    await expect(page.getByLabel("Filtrer par résultat")).toBeVisible();
    await expect(page.getByLabel("Filtrer par contrôleur")).toBeVisible();
    await expect(page.getByLabel("Filtrer par table")).toBeVisible();
  });
});
