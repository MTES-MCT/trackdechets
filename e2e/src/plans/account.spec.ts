import { test } from "@playwright/test";
import {
  activateUser,
  failedLogin,
  logout,
  successfulLogin,
  successfulSignup,
  testAccountInfo,
  testPasswordUpdate,
  testSignupPasswordPolicy,
  testUserProfileUpdate
} from "../utils/user";
import { testNavigation } from "../utils/navigation";

test.describe
  .serial("Cahier de recette Inscription / gestion de compte", async () => {
  // User credentials
  const USER_NAME = "User e2e Accounts";
  const USER_EMAIL = "user.e2e.accounts@mail.com";
  const USER_PASSWORD = "Us3r_E2E_AcC0unts$$";
  const NEW_USER_PASSWORD = "Us3r_E2E_AcC0unts$$Bis";

  test("Tentative de connexion avec un compte non-existant", async ({
    page
  }) => {
    await failedLogin(page, {
      email: USER_EMAIL,
      password: USER_PASSWORD
    });
  });

  test("Création de compte > Force du mot de passe", async ({ page }) => {
    await testSignupPasswordPolicy(page);
  });

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

  test("Connexion avec un compte existant mais un mot de passe erroné", async ({
    page
  }) => {
    await failedLogin(page, {
      email: USER_EMAIL,
      password: USER_PASSWORD + "e"
    });
  });

  test("Connexion avec un compte existant mais une erreur dans l'email", async ({
    page
  }) => {
    await failedLogin(page, {
      email: "e" + USER_EMAIL,
      password: USER_PASSWORD
    });
  });

  test("Utilisateur connecté: modification des informations de compte", async ({
    page
  }) => {
    await test.step("Connexion avec un compte valide", async () => {
      await successfulLogin(page, {
        email: USER_EMAIL,
        password: USER_PASSWORD
      });
    });

    await test.step("Clic sur 'Mes bordereaux' > redirige vers la page 'Etablissements'", async () => {
      await testNavigation(page, {
        linkLabel: "Mes bordereaux",
        targetUrl: "/account/companies/create"
      });
    });

    await test.step("Clic sur 'Mon compte' > redirige vers la page 'Mes paramètres'", async () => {
      await testNavigation(page, {
        linkLabel: "Mon compte",
        targetUrl: "/account/info",
        targetPageLabel: "Mes paramètres"
      });
    });

    await test.step("Onglet 'Mon compte' > les bonnes informations sont affichées", async () => {
      await testAccountInfo(page, {
        username: USER_NAME,
        email: USER_EMAIL
      });
    });

    await test.step("Onglet 'Mon compte' > Modification des paramètres de l'utilisateur", async () => {
      await testUserProfileUpdate(page);
    });

    await test.step("Onglet 'Mon compte' > Modification du mot de passe", async () => {
      await testPasswordUpdate(page, {
        oldPassword: USER_PASSWORD,
        newPassword: NEW_USER_PASSWORD
      });
    });

    await test.step("Logout", async () => {
      await logout(page);
    });
  });

  test("Tentative de connexion avec un ancien mot de passe", async ({
    page
  }) => {
    await failedLogin(page, {
      email: USER_EMAIL,
      password: USER_PASSWORD
    });
  });

  test("Connexion avec un nouveau mot de passe", async ({ page }) => {
    await successfulLogin(page, {
      email: USER_EMAIL,
      password: NEW_USER_PASSWORD
    });
  });
});
