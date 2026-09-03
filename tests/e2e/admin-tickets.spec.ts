import { test, expect, type Page } from "@playwright/test";

function pickEnv(...values: (string | undefined)[]): string | undefined {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
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
      email: process.env.SEED_CONTROLLER1_EMAIL?.trim(),
      password: process.env.SEED_CONTROLLER1_PASSWORD?.trim(),
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
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      await page.context().clearCookies();
      await page.goto("/connexion");
      await page.locator("#email").fill(email);
      await page.locator("#password").fill(password);
      await page.getByRole("button", { name: /Se connecter/i }).click();
      await page.waitForURL(/\/admin\/?$/, { timeout: 60_000 });
      return;
    } catch (error) {
      lastError = error;
      await page.waitForTimeout(1_500);
    }
  }
  throw lastError;
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

async function createGuest(page: Page, lastName: string, firstNames: string) {
  await page.goto("/admin/invites");
  await expect(page.getByRole("heading", { name: "Invités", exact: true })).toBeVisible({
    timeout: 45_000,
  });
  await page.getByRole("button", { name: /Ajouter un invité/i }).first().click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel(/^Nom/i).fill(lastName);
  await dialog.getByLabel(/^Prénoms/i).fill(firstNames);
  await dialog.getByRole("button", { name: /Créer l'invité/i }).click();
  await expect(page.getByRole("heading", { name: "Invité créé" })).toBeVisible({
    timeout: 60_000,
  });
  await dialog.getByRole("status").getByRole("button", { name: "Fermer" }).click();
}

async function openCreateTicketWizard(page: Page) {
  await page.goto("/admin/billets");
  await expect(page.getByRole("heading", { name: "Billets", exact: true })).toBeVisible({
    timeout: 45_000,
  });
  await page.getByRole("button", { name: /Créer un billet/i }).first().click();
  return page.getByRole("dialog");
}

async function cancelAllActiveTickets(page: Page) {
  await page.goto("/admin/billets");
  await expect(page.getByRole("heading", { name: "Billets", exact: true })).toBeVisible({
    timeout: 45_000,
  });
  const statusFilter = page.getByLabel(/Filtrer par statut/i);
  if ((await statusFilter.count()) > 0) {
    await statusFilter.selectOption("ACTIVE");
  }
  for (let i = 0; i < 25; i += 1) {
    const moreActions = page.getByLabel(/Plus d’actions pour/i).first();
    if ((await moreActions.count()) === 0) break;
    if (!(await moreActions.isVisible().catch(() => false))) break;
    await moreActions.click();
    const cancelItem = page.getByRole("button", { name: /Annuler le billet/i });
    if ((await cancelItem.count()) === 0) {
      await page.keyboard.press("Escape");
      break;
    }
    await cancelItem.click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: /Confirmer l'annulation/i }).click();
    await expect(page.getByText("Billet annulé")).toBeVisible({ timeout: 60_000 });
    await page.goto("/admin/billets");
    if ((await statusFilter.count()) > 0) {
      await page.getByLabel(/Filtrer par statut/i).selectOption("ACTIVE");
    }
  }
}

const adminCredentials = getAdminCredentials();
const adminTicketTests =
  adminCredentials.email && adminCredentials.password ? test.describe : test.describe.skip;

adminTicketTests("Gestion des billets — ADMIN", () => {
  test.describe.configure({ mode: "serial", timeout: 180_000 });

  const stamp = Date.now();
  const singleLastName = `TKTSINGLE-${stamp}`;
  const coupleA = `TKTCOUPA-${stamp}`;
  const coupleB = `TKTCOUPB-${stamp}`;

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page, adminCredentials.email!, adminCredentials.password!);
  });

  test("affiche la liste des billets", async ({ page }) => {
    await page.goto("/admin/billets");
    await expect(page.getByRole("heading", { name: "Billets", exact: true })).toBeVisible({
      timeout: 45_000,
    });
    await expect(page.getByRole("button", { name: /Créer un billet/i }).first()).toBeVisible();
  });

  test("crée un billet Single", async ({ page }) => {
    await cancelAllActiveTickets(page);
    await createGuest(page, singleLastName, "Alice");
    const dialog = await openCreateTicketWizard(page);
    await dialog.getByRole("button", { name: /Single/i }).click();
    await dialog.getByRole("button", { name: /^Continuer$/i }).click();
    await dialog.getByLabel(/Rechercher un invité/i).fill(singleLastName);
    await expect(dialog.getByText(new RegExp(singleLastName, "i")).first()).toBeVisible({
      timeout: 45_000,
    });
    await dialog
      .locator("button")
      .filter({ hasText: new RegExp(singleLastName, "i") })
      .first()
      .click();
    await dialog.getByRole("button", { name: /^Continuer$/i }).click();
    await dialog.locator("select").selectOption({ index: 1 });
    await dialog.getByRole("button", { name: /^Continuer$/i }).click();
    await expect(dialog.getByText(/1 place · 1 QR/i)).toBeVisible();
    await dialog.getByRole("button", { name: /Générer le billet/i }).click();
    await expect(page.getByRole("heading", { name: "Billet créé" })).toBeVisible({
      timeout: 90_000,
    });
    await dialog.getByRole("status").getByRole("button", { name: "Fermer" }).click();
  });

  test("crée un billet Couple", async ({ page }) => {
    await createGuest(page, coupleA, "Paul");
    await createGuest(page, coupleB, "Claire");
    const dialog = await openCreateTicketWizard(page);
    await dialog.getByRole("button", { name: /Couple/i }).click();
    await expect(dialog.getByRole("button", { name: /^Continuer$/i })).toBeEnabled({
      timeout: 45_000,
    });
    await dialog.getByRole("button", { name: /^Continuer$/i }).click();
    await dialog.getByLabel(/Rechercher un invité/i).fill("TKTCOUP");
    await expect(
      dialog.locator("button").filter({ hasText: new RegExp(coupleA, "i") }),
    ).toBeVisible({ timeout: 45_000 });
    await dialog.locator("button").filter({ hasText: new RegExp(coupleA, "i") }).click();
    await dialog.locator("button").filter({ hasText: new RegExp(coupleB, "i") }).click();
    await dialog.getByRole("button", { name: /^Continuer$/i }).click();
    await dialog.locator("select").selectOption({ index: 1 });
    await dialog.getByRole("button", { name: /^Continuer$/i }).click();
    await expect(dialog.getByText(/2 places · 1 QR/i)).toBeVisible();
    await dialog.getByRole("button", { name: /Générer le billet/i }).click();
    await expect(page.getByRole("heading", { name: "Billet créé" })).toBeVisible({
      timeout: 90_000,
    });
  });

  test("refuse un deuxième billet actif pour le même invité", async ({ page }) => {
    const dialog = await openCreateTicketWizard(page);
    await dialog.getByRole("button", { name: /Single/i }).click();
    await dialog.getByRole("button", { name: /^Continuer$/i }).click();
    await dialog.getByLabel(/Rechercher un invité/i).fill(singleLastName);
    await expect(
      dialog.getByText(/Aucun invité actif sans billet/i),
    ).toBeVisible({ timeout: 45_000 });
    await expect(
      dialog.locator("button").filter({ hasText: new RegExp(singleLastName, "i") }),
    ).toHaveCount(0);
  });

  test("annule un billet et libère les places", async ({ page }) => {
    await page.goto("/admin/billets");
    await page.getByLabel(/Filtrer par statut/i).selectOption("ACTIVE");
    await page.getByLabel(/Rechercher un billet/i).fill(singleLastName);
    const moreActions = page.getByLabel(/Plus d’actions pour/i).first();
    await expect(moreActions).toBeVisible({ timeout: 45_000 });
    await moreActions.click();
    await page.getByRole("button", { name: /Annuler le billet/i }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: /Confirmer l'annulation/i }).click();
    await expect(page.getByText("Billet annulé")).toBeVisible({ timeout: 60_000 });
  });

  test("télécharge ou régénère un PDF", async ({ page }) => {
    await page.goto("/admin/billets");
    await page.getByLabel(/Filtrer par statut/i).selectOption("ACTIVE");
    const viewButton = page.getByLabel(/^Voir /i).first();
    await expect(viewButton).toBeVisible({ timeout: 45_000 });
    await viewButton.click();
    const dialog = page.getByRole("dialog");
    const download = dialog.getByRole("button", { name: /Télécharger/i });
    const regenerate = dialog.getByRole("button", { name: /Régénérer le PDF/i });
    if ((await download.count()) > 0) {
      await Promise.all([
        page.waitForEvent("download", { timeout: 60_000 }).catch(() => null),
        download.click(),
      ]);
      await expect(download).toBeVisible();
    } else {
      await regenerate.click();
      await expect(dialog.getByRole("button", { name: /Télécharger/i })).toBeVisible({
        timeout: 90_000,
      });
    }
  });
});

const controllerPairs = getControllerCredentialPairs();
const controllerTicketTests = controllerPairs.length > 0 ? test.describe : test.describe.skip;

controllerTicketTests("Gestion des billets — CONTROLLER refusé", () => {
  test("redirige un contrôleur depuis /admin/billets", async ({ page }) => {
    let loggedIn = false;
    for (const pair of controllerPairs) {
      loggedIn = await tryLogin(page, pair.email, pair.password);
      if (loggedIn) break;
    }
    test.skip(!loggedIn, "Aucun identifiant contrôleur seed valide.");
    await page.goto("/admin/billets");
    await expect(page).toHaveURL(/\/controle\/scan\/?$/);
  });
});

adminTicketTests("Gestion des billets — mobile", () => {
  test.describe.configure({ timeout: 90_000 });
  test("affiche une liste mobile sans tableau horizontal", async ({ page }) => {
    await loginAsAdmin(page, adminCredentials.email!, adminCredentials.password!);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/admin/billets");
    await expect(page.getByRole("heading", { name: "Billets", exact: true })).toBeVisible({
      timeout: 45_000,
    });
    await expect(page.locator("table").first()).toBeHidden();
  });
});
