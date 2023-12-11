import { test } from "@playwright/test";
import {
  activateUser,
  failedLogin,
  logout,
  successfulLogin,
  successfulSignup,
  testAccountInfo,
  testPasswordUpdate,
  testPhoneNbrUpdate
} from "../utils/user";
import { testNavigation } from "../utils/navigation";

test.describe
  .serial("Cahier de recette Inscription / gestion de compte", async () => {
  // User credentials
  const USER_NAME = "User e2e n°1";
  const USER_EMAIL = "user.e2e.n1@mail.com";
  const USER_PASSWORD = "Us3r_E2E_0ne$$$";
  const NEW_USER_PASSWORD = "Us3r_E2E_0ne$$$Bis";

  test("Tentative de connexion avec un compte non-existant", async ({
    page
  }) => {
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

  test("Connexion avec un compte valide > Mauvais mot de passe", async ({
    page
  }) => {
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

  test("Utilisateur connecté: modification des informations de compte", async ({
    page
  }) => {
    await test.step("Connexion avec un compte valide", async () => {
      await successfulLogin(page, {
        email: USER_EMAIL,
        password: USER_PASSWORD
      });
    });

    await test.step("Clic sur 'Mon espace' > redirige vers la page 'Etablissements'", async () => {
      await testNavigation(page, {
        linkLabel: "Mon espace",
        targetUrl: "/account/companies",
        targetPageLabel: "Établissements"
      });
    });

    await test.step("Clic sur 'Mes bordereaux' > redirige vers la page 'Etablissements'", async () => {
      await testNavigation(page, {
        linkLabel: "Mes bordereaux",
        targetUrl: "/account/companies",
        targetPageLabel: "Établissements"
      });
    });

    await test.step("Clic sur 'Mon compte' > redirige vers la page 'Informations générales'", async () => {
      await testNavigation(page, {
        linkLabel: "Mon compte",
        targetUrl: "/account/info",
        targetPageLabel: "Informations générales"
      });
    });

    await test.step("Onglet'Mon compte' > les bonnes informations sont affichées", async () => {
      await testAccountInfo(page, {
        username: USER_NAME,
        email: USER_EMAIL
      });
    });

    await test.step("Onglet'Mon compte' > Modification du numéro de téléphone", async () => {
      await testPhoneNbrUpdate(page);
    });

    await test.step("Onglet'Mon compte' > Modification du mot de passe", async () => {
      await testPasswordUpdate(page, {
        oldPassword: USER_PASSWORD,
        newPassword: NEW_USER_PASSWORD
      });
    });

    await test.step("Onglet'Mon compte' > Logout", async () => {
      await logout(page);
    });
  });

  test("Onglet'Mon compte' > Tentative de connexion avec l'ancien mot de passe", async ({
    page
  }) => {
    await failedLogin(page, {
      email: USER_EMAIL,
      password: USER_PASSWORD
    });
  });

  test("Onglet'Mon compte' > Connexion avec le nouveau mot de passe", async ({
    page
  }) => {
    await successfulLogin(page, {
      email: USER_EMAIL,
      password: NEW_USER_PASSWORD
    });
  });
});
