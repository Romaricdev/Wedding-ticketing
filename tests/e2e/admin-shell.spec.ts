import { test, expect, type Page } from "@playwright/test";

function pickEnv(...values: (string | undefined)[]): string | undefined {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) {
      return trimmed;
    }
  }

  return undefined;
}

function getAdminCredentials() {
  return {
    email: pickEnv(process.env.E2E_ADMIN_EMAIL, process.env.SEED_ADMIN_EMAIL),
    password: pickEnv(process.env.E2E_ADMIN_PASSWORD, process.env.SEED_ADMIN_PASSWORD),
  };
}

async function loginAsAdmin(page: Page, email: string, password: string) {
  await page.goto("/connexion");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: /Se connecter/i }).click();
  await page.waitForURL(/\/admin\/?$/, { timeout: 45_000 });
}

const credentials = getAdminCredentials();
const adminShellTests =
  credentials.email && credentials.password ? test.describe : test.describe.skip;

adminShellTests("Shell admin", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page, credentials.email!, credentials.password!);
  });

  test("affiche le tableau de bord avec métriques", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Tableau de bord" })).toBeVisible();
    await expect(page.getByText("Tables configurées")).toBeVisible();
    await expect(page.getByText("Invités enregistrés")).toBeVisible();
    await expect(page.getByText("Billets générés")).toBeVisible();
  });

  test("navigue via la sidebar desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const invitesLink = page
      .getByRole("navigation", { name: "Navigation principale" })
      .getByRole("link", { name: "Invités" });
    await expect(invitesLink).toBeVisible();
    await Promise.all([
      page.waitForURL(/\/admin\/invites\/?$/, { timeout: 45_000 }),
      invitesLink.click(),
    ]);
    await expect(page.getByRole("heading", { name: "Invités", exact: true })).toBeVisible({
      timeout: 45_000,
    });
  });

  test("ouvre le menu mobile et ferme après navigation", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.getByRole("button", { name: /Ouvrir le menu de navigation/i }).click();
    const tablesLink = page
      .getByRole("navigation", { name: "Navigation mobile" })
      .getByRole("link", { name: "Tables" });
    await expect(tablesLink).toBeVisible();
    await Promise.all([
      page.waitForURL(/\/admin\/tables\/?$/, { timeout: 45_000 }),
      tablesLink.click(),
    ]);
    await expect(page.getByRole("button", { name: /Ouvrir le menu de navigation/i })).toBeVisible();
  });
});
