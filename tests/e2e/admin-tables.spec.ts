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

function getControllerCredentialPairs() {
  return [
    {
      email: pickEnv(process.env.E2E_CONTROLLER_EMAIL, process.env.SEED_CONTROLLER1_EMAIL),
      password: pickEnv(
        process.env.E2E_CONTROLLER_PASSWORD,
        process.env.SEED_CONTROLLER1_PASSWORD,
      ),
    },
    {
      email: process.env.SEED_CONTROLLER2_EMAIL?.trim(),
      password: process.env.SEED_CONTROLLER2_PASSWORD?.trim(),
    },
  ].filter(
    (pair): pair is { email: string; password: string } =>
      Boolean(pair.email && pair.password),
  );
}

async function loginAsAdmin(page: Page, email: string, password: string) {
  await page.goto("/connexion");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: /Se connecter/i }).click();
  await page.waitForURL(/\/admin\/?$/, { timeout: 45_000 });
}

async function tryLogin(page: Page, email: string, password: string): Promise<boolean> {
  await page.goto("/connexion");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: /Se connecter/i }).click();

  const loginFailed = page.getByRole("heading", { name: "Connexion impossible" });
  const redirected = page.waitForURL(/\/(admin|controle\/scan)\/?$/, { timeout: 45_000 });

  const outcome = await Promise.race([
    redirected.then(() => "ok" as const),
    loginFailed.waitFor({ state: "visible", timeout: 45_000 }).then(() => "error" as const),
  ]);

  return outcome === "ok";
}

const adminCredentials = getAdminCredentials();
const adminTableTests =
  adminCredentials.email && adminCredentials.password ? test.describe : test.describe.skip;

adminTableTests("Gestion des tables — ADMIN", () => {
  test.describe.configure({ mode: "serial", timeout: 60_000 });

  const uniqueLabel = `E2E-${Date.now()}`;

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page, adminCredentials.email!, adminCredentials.password!);
  });

  test("affiche la liste des tables avec filtres", async ({ page }) => {
    await page.goto("/admin/tables");
    await expect(page.getByRole("heading", { name: "Tables", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /Ajouter une table/i })).toBeVisible();
    await expect(page.getByLabel(/Rechercher une table/i)).toBeVisible();
  });

  test("crée une table vide depuis un modal", async ({ page }) => {
    await page.goto("/admin/tables");
    await page.getByRole("button", { name: /Ajouter une table/i }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel(/Nom ou numéro de table/i).fill(uniqueLabel);
    await dialog.getByLabel(/^Capacité/i).fill("5");
    await dialog.getByRole("button", { name: /Créer la table/i }).click();
    await expect(page.getByRole("heading", { name: "Table créée" })).toBeVisible({
      timeout: 45_000,
    });
  });

  test("modifie la capacité de la table créée", async ({ page }) => {
    await page.goto("/admin/tables");
    await page.getByPlaceholder("Rechercher une table…").fill(uniqueLabel);
    await page.getByLabel(`Modifier ${uniqueLabel}`).click();
    await page.getByRole("dialog").getByLabel(/^Capacité/i).fill("7");
    await page.getByRole("dialog").getByRole("button", { name: /Enregistrer les modifications/i }).click();
    await expect(page.getByRole("heading", { name: "Modifications enregistrées" })).toBeVisible({
      timeout: 45_000,
    });
  });

  test("supprime la table vide créée", async ({ page }) => {
    await page.goto("/admin/tables");
    await page.getByPlaceholder("Rechercher une table…").fill(uniqueLabel);
    await page.getByLabel(`Plus d’actions pour ${uniqueLabel}`).click();
    await page.getByRole("button", { name: "Supprimer la table" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Supprimer la table" }).click();
    await page.waitForURL(/deleted=1/, { timeout: 45_000 });
    await page.getByPlaceholder("Rechercher une table…").fill(uniqueLabel);
    await expect(page.getByRole("heading", { name: "Aucun résultat" })).toBeVisible();
  });

  test("refuse un doublon de nom", async ({ page }) => {
    await page.goto("/admin/tables");
    await page.getByRole("button", { name: /Ajouter une table/i }).click();
    await page.getByRole("dialog").getByLabel(/Nom ou numéro de table/i).fill("Table 1");
    await page.getByRole("dialog").getByLabel(/^Capacité/i).fill("8");
    await page.getByRole("dialog").getByRole("button", { name: /Créer la table/i }).click();
    await expect(page.getByText(/existe déjà/i)).toBeVisible({ timeout: 60_000 });
  });
});

const controllerPairs = getControllerCredentialPairs();
const controllerTableTests = controllerPairs.length > 0 ? test.describe : test.describe.skip;

controllerTableTests("Gestion des tables — CONTROLLER refusé", () => {
  test("redirige un contrôleur depuis /admin/tables", async ({ page }) => {
    let loggedIn = false;

    for (const pair of controllerPairs) {
      loggedIn = await tryLogin(page, pair.email, pair.password);
      if (loggedIn) break;
    }

    test.skip(!loggedIn, "Aucun identifiant contrôleur seed valide.");

    await page.goto("/admin/tables");
    await expect(page).toHaveURL(/\/controle\/scan\/?$/);
  });
});

adminTableTests("Gestion des tables — mobile", () => {
  test("affiche une liste mobile sans tableau horizontal", async ({ page }) => {
    await loginAsAdmin(page, adminCredentials.email!, adminCredentials.password!);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/admin/tables");
    await expect(page.getByRole("heading", { name: "Tables", exact: true })).toBeVisible();
    await expect(page.locator("table").first()).toBeHidden();
    await expect(page.getByRole("link", { name: "Table 1" })).toBeVisible();
  });
});
