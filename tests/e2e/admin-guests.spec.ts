import { test, expect, type Page } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";

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
const adminGuestTests =
  adminCredentials.email && adminCredentials.password ? test.describe : test.describe.skip;

adminGuestTests("Gestion des invités — ADMIN", () => {
  test.describe.configure({ mode: "serial", timeout: 90_000 });

  const stamp = Date.now();
  const lastName = `E2E-${stamp}`;
  const firstNames = "Alice";
  const updatedFirstNames = "Alice-Marie";
  const importLastName = `E2EIMPORT-${stamp}`;

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page, adminCredentials.email!, adminCredentials.password!);
  });

  test("affiche la liste des invités avec filtres", async ({ page }) => {
    await page.goto("/admin/invites");
    await expect(page.getByRole("heading", { name: "Invités", exact: true })).toBeVisible({
      timeout: 45_000,
    });
    await expect(page.getByRole("button", { name: /Ajouter un invité/i })).toBeVisible();
    await expect(page.getByLabel(/Rechercher un invité/i)).toBeVisible();
  });

  test("crée un invité via modal", async ({ page }) => {
    await page.goto("/admin/invites");
    await page.getByRole("button", { name: /Ajouter un invité/i }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel(/^Nom/i).fill(lastName);
    await dialog.getByLabel(/^Prénoms/i).fill(firstNames);
    await dialog.getByLabel(/^Notes/i).fill("E2E create");
    await dialog.getByRole("button", { name: /Créer l'invité/i }).click();
    await expect(page.getByRole("heading", { name: "Invité créé" })).toBeVisible({
      timeout: 60_000,
    });
    await dialog.getByRole("status").getByRole("button", { name: "Fermer" }).click();
    await page.getByLabel(/Rechercher un invité/i).fill(lastName);
    await expect(page.getByText(new RegExp(lastName, "i")).first()).toBeVisible({
      timeout: 30_000,
    });
  });

  test("modifie un invité via modal", async ({ page }) => {
    await page.goto("/admin/invites");
    await page.getByLabel(/Rechercher un invité/i).fill(lastName);
    await page.getByLabel(new RegExp(`Modifier ${lastName}`, "i")).first().click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel(/^Prénoms/i).fill(updatedFirstNames);
    await dialog.getByRole("button", { name: /Enregistrer les modifications/i }).click();
    await expect(
      page.getByRole("heading", { name: "Modifications enregistrées" }),
    ).toBeVisible({ timeout: 60_000 });
  });

  test("filtre et bascule tableau/cartes", async ({ page }) => {
    await page.goto("/admin/invites");
    await page.getByLabel(/Rechercher un invité/i).fill(lastName);
    await expect(page.getByText(new RegExp(lastName, "i")).first()).toBeVisible();
    await page.getByLabel("Vue cartes").click();
    await expect(page.getByText(new RegExp(lastName, "i")).first()).toBeVisible();
    await page.getByLabel("Vue tableau").click();
    await page.getByLabel(/Filtrer par statut|guest-status-filter/i).selectOption("ACTIVE");
    await expect(page.getByText(new RegExp(lastName, "i")).first()).toBeVisible();
  });

  test("annule un invité avec confirmation", async ({ page }) => {
    await page.goto("/admin/invites");
    await page.getByLabel(/Rechercher un invité/i).fill(lastName);
    await page
      .getByLabel(new RegExp(`Plus d’actions pour ${lastName}`, "i"))
      .first()
      .click();
    await page.getByRole("button", { name: /Annuler l'invité/i }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel(/Motif/i).fill("E2E cancel");
    await dialog.getByRole("button", { name: /Confirmer l'annulation/i }).click();
    await expect(page.getByText("Invité annulé")).toBeVisible({ timeout: 60_000 });
    await page.getByLabel(/Rechercher un invité/i).fill(lastName);
    await page.locator("#guest-status-filter").selectOption("CANCELLED");
    await expect(
      page.getByRole("row", { name: new RegExp(lastName, "i") }).getByText("Annulé"),
    ).toBeVisible();
  });

  test("importe un CSV valide", async ({ page }) => {
    const csvPath = path.join(os.tmpdir(), `guests-valid-${stamp}.csv`);
    fs.writeFileSync(
      csvPath,
      `nom,prenoms,notes\n${importLastName},Bob,Import E2E\n`,
      "utf8",
    );

    await page.goto("/admin/invites");
    await page.getByRole("button", { name: /Importer un CSV/i }).click();
    const dialog = page.getByRole("dialog");
    await dialog.locator("#guest-csv-file").setInputFiles(csvPath);
    await dialog.getByRole("button", { name: /Analyser le fichier/i }).click();
    await expect(dialog.getByText(/Valides/i)).toBeVisible({ timeout: 45_000 });
    await dialog.getByRole("button", { name: /Confirmer l'import/i }).click();
    await expect(page.getByRole("heading", { name: "Import terminé" })).toBeVisible({
      timeout: 60_000,
    });
    await dialog.getByRole("status").getByRole("button", { name: "Fermer" }).click();
    await page.getByLabel(/Rechercher un invité/i).fill(importLastName);
    await expect(page.getByText(new RegExp(importLastName, "i")).first()).toBeVisible();

    fs.unlinkSync(csvPath);
  });

  test("refuse un CSV invalide sans écriture partielle", async ({ page }) => {
    const csvPath = path.join(os.tmpdir(), `guests-invalid-${stamp}.csv`);
    fs.writeFileSync(
      csvPath,
      `nom,prenoms,notes\n,InvalidFirst,\nValidNom,ValidPrenom,\n`,
      "utf8",
    );

    await page.goto("/admin/invites");
    const beforeCount = await page
      .getByText(/invité(s)? affiché/i)
      .first()
      .textContent()
      .catch(() => "");

    await page.getByRole("button", { name: /Importer un CSV/i }).click();
    const dialog = page.getByRole("dialog");
    await dialog.locator("#guest-csv-file").setInputFiles(csvPath);
    await dialog.getByRole("button", { name: /Analyser le fichier/i }).click();
    await expect(dialog.getByText(/Erreurs bloquantes/i)).toBeVisible({ timeout: 45_000 });
    await expect(dialog.getByRole("button", { name: /Confirmer l'import/i })).toBeDisabled();
    await dialog.getByRole("button", { name: "Fermer", exact: true }).click();

    await page.getByLabel(/Rechercher un invité/i).fill("ValidNom");
    await expect(page.getByRole("heading", { name: "Aucun résultat" })).toBeVisible();

    void beforeCount;
    fs.unlinkSync(csvPath);
  });

  test("exporte un CSV", async ({ page }) => {
    await page.goto("/admin/invites");
    const downloadPromise = page.waitForEvent("download", { timeout: 60_000 });
    await page.getByRole("button", { name: /Exporter CSV/i }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/invites-.*\.csv/);
  });
});

const controllerPairs = getControllerCredentialPairs();
const controllerGuestTests = controllerPairs.length > 0 ? test.describe : test.describe.skip;

controllerGuestTests("Gestion des invités — CONTROLLER refusé", () => {
  test("redirige un contrôleur depuis /admin/invites", async ({ page }) => {
    let loggedIn = false;

    for (const pair of controllerPairs) {
      loggedIn = await tryLogin(page, pair.email, pair.password);
      if (loggedIn) break;
    }

    test.skip(!loggedIn, "Aucun identifiant contrôleur seed valide.");

    await page.goto("/admin/invites");
    await expect(page).toHaveURL(/\/controle\/scan\/?$/);
  });
});

adminGuestTests("Gestion des invités — mobile", () => {
  test("affiche une liste mobile sans tableau horizontal", async ({ page }) => {
    await loginAsAdmin(page, adminCredentials.email!, adminCredentials.password!);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/admin/invites");
    await expect(page.getByRole("heading", { name: "Invités", exact: true })).toBeVisible({
      timeout: 45_000,
    });
    await expect(page.locator("table").first()).toBeHidden();
  });
});
