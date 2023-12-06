import { test } from "@playwright/test";
import {
  activateUser,
  failedLogin,
  successfulLogin,
  successfulSignup
} from "./utils/user";
import { testClicRedirectsTo } from "./utils/navigation";

// If a tests fails, skip others & exit
test.describe.configure({ mode: 'serial' });

test.describe("Cahier de recette Inscription / gestion de compte", async () => {
  const USER_NAME = `User e2e n°1`;
  const USER_EMAIL = `user.e2e.n1@mail.com`;
  const USER_PASSWORD = "Us3r_E2E_0ne$$$";

  test("Tentative de connexion avec un compte non-existant", async ({ page }) => {
    await failedLogin(page, {
      email: USER_EMAIL,
      password: USER_PASSWORD
    });
  });

  // TODO: re-enable me when bug is fixed!
  // test("Création de compte > Force du mot de passe", async ({ page }) => {
  //   await testSignupPasswordPolicy(page);
  // });

  test("Création de compte", async ({ page }) => {
    await successfulSignup(page, {
      username: USER_NAME,
      email: USER_EMAIL,
      password: USER_PASSWORD
    });
  });

  test("Activation du compte", async ({ page }) => {
    await activateUser(page, { email: USER_EMAIL });
  });

  test("Connexion avec un compte valide > Mauvais mot de passe", async ({ page }) => {
    await failedLogin(page, {
      email: USER_EMAIL,
      password: USER_PASSWORD + "e"
    });
  });

  test("Connexion avec un compte valide > Mauvais email", async ({ page }) => {
    await failedLogin(page, {
      email: "e" + USER_EMAIL,
      password: USER_PASSWORD
    });
  });

  test("Connexion avec un compte valide", async ({ page }) => {
    await successfulLogin(page, {
      email: USER_EMAIL,
      password: USER_PASSWORD
    });
  });

  test("Clic sur 'Mon espace' > redirige vers la page 'Etablissements'", async ({ page }) => {
    await testClicRedirectsTo(page, {
      linkLabel: "Mon espace",
      url: "/account/companies",
      pageLabel: "Établissements"
    });
  });

  test("Clic sur 'Mes bordereaux' > redirige vers la page 'Etablissements'", async ({ page }) => {
    await testClicRedirectsTo(page, {
      linkLabel: "Mes bordereaux",
      url: "/account/companies",
      pageLabel: "Établissements"
    });
  });

  test("Clic sur 'Mon compte' > redirige vers la page 'Informations générales'", async ({ page }) => {
    await testClicRedirectsTo(page, {
      linkLabel: "Mon compte",
      url: "/account/info",
      pageLabel: "Informations générales"
    });
  });
});
