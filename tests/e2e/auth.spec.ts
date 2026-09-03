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

function getRoleCredentials() {
  const controllerPairs = getControllerCredentialPairs();

  return {
    adminEmail: pickEnv(process.env.E2E_ADMIN_EMAIL, process.env.SEED_ADMIN_EMAIL),
    adminPassword: pickEnv(
      process.env.E2E_ADMIN_PASSWORD,
      process.env.SEED_ADMIN_PASSWORD,
    ),
    controllerEmail: controllerPairs[0]?.email,
    controllerPassword: controllerPairs[0]?.password,
  };
}

function hasRoleCredentials(credentials: ReturnType<typeof getRoleCredentials>) {
  return Boolean(
    credentials.adminEmail &&
      credentials.adminPassword &&
      getControllerCredentialPairs().length > 0,
  );
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

async function login(page: Page, email: string, password: string) {
  const success = await tryLogin(page, email, password);

  if (!success) {
    const message = await page.getByRole("alert").locator("p").textContent();
    throw new Error(`Connexion échouée pour ${email} : ${message ?? "erreur inconnue"}`);
  }
}

async function loginController(page: Page) {
  for (const pair of getControllerCredentialPairs()) {
    if (await tryLogin(page, pair.email, pair.password)) {
      return;
    }
  }

  throw new Error(
    "Aucun identifiant contrôleur seed valide. Vérifiez SEED_CONTROLLER* dans .env.local puis npm run db:seed.",
  );
}

test.describe("Protection des routes — non connecté", () => {
  test("redirige /admin vers /connexion", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/connexion/);
  });

  test("redirige /controle/scan vers /connexion", async ({ page }) => {
    await page.goto("/controle/scan");
    await expect(page).toHaveURL(/\/connexion/);
  });

  test("affiche le formulaire de connexion", async ({ page }) => {
    await page.goto("/connexion");
    await expect(page.getByRole("heading", { name: "Connexion" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Se connecter/i })).toBeVisible();
  });

  test("affiche une erreur avec des identifiants invalides", async ({ page }) => {
    await page.goto("/connexion");
    await page.getByLabel(/E-mail ou identifiant/i).fill("invalide@example.com");
    await page.getByLabel(/^Mot de passe/i).fill("mot-de-passe-invalide");
    await page.getByRole("button", { name: /Se connecter/i }).click();

    await expect(
      page.getByRole("heading", { name: "Connexion impossible" }),
    ).toBeVisible();
    await expect(page.getByText("Identifiants invalides ou service indisponible.")).toBeVisible();
    await expect(page).toHaveURL(/\/connexion/);
  });
});

const roleCredentials = getRoleCredentials();
const roleTests = hasRoleCredentials(roleCredentials) ? test.describe : test.describe.skip;

roleTests("Protection des routes — rôles seed", () => {
  test.describe.configure({ mode: "serial", timeout: 60_000 });

  const credentials = roleCredentials;

  test("ADMIN accède à /admin", async ({ page }) => {
    await login(page, credentials.adminEmail!, credentials.adminPassword!);
    await expect(page).toHaveURL(/\/admin\/?$/);
    await expect(page.getByRole("heading", { name: "Tableau de bord" })).toBeVisible();
  });

  test("CONTROLLER est refusé sur /admin", async ({ page }) => {
    await loginController(page);
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/controle\/scan\/?$/);
  });

  test("CONTROLLER accède à /controle/scan", async ({ page }) => {
    await loginController(page);
    await expect(page).toHaveURL(/\/controle\/scan\/?$/);
    await expect(page.getByRole("heading", { name: "Scanner" })).toBeVisible();
  });

  test("ADMIN accède aussi à /controle/scan", async ({ page }) => {
    await login(page, credentials.adminEmail!, credentials.adminPassword!);
    await page.goto("/controle/scan");
    await expect(page).toHaveURL(/\/controle\/scan\/?$/);
    await expect(page.getByRole("heading", { name: "Scanner" })).toBeVisible();
  });
});

test.describe("Page accès refusé", () => {
  test("affiche un message clair sans détail technique", async ({ page }) => {
    await page.goto("/acces-refuse");
    await expect(page.getByRole("heading", { name: "Accès non autorisé" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Se connecter" })).toBeVisible();
  });
});
