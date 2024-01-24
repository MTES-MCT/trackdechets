import { expect, test } from "@playwright/test";
import { seedCompany, seedCompanyAssociation } from "../data/company";
import { logout, successfulLogin } from "../utils/user";
import {
  deleteInvitation,
  inviteUserToCompany,
  resendInvitation,
  revokeAccess,
  verifyCompanyAccess,
  visitExpiredInvitationLink,
  visitInvitationLinkAsNonRegisteredUser
} from "../utils/roles";
import { seedUser } from "../data/user";
import { checkCurrentURL } from "../utils/navigation";

test.describe.serial("Cahier de recette de gestion des membres", async () => {
  // Admin
  const ADMIN_NAME = "User e2e Roles";
  const ADMIN_EMAIL = "user.e2e.roles@mail.com";
  const ADMIN_PASSWORD = "Us3r_E2E_R0l3$$";

  // Seeded data
  let admin;
  let company;

  test("Seed de l'administrateur", async () => {
    admin = await seedUser({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });

    expect(admin).not.toBeUndefined();
  });

  test("Seed de l'entreprise", async () => {
    company = await seedCompany({
      name: "Producteur avec signature et emport autorisé",
      allowBsdasriTakeOverWithoutSignature: true,
      companyTypes: ["PRODUCER"]
    });

    expect(company).not.toBeUndefined();

    const association = await seedCompanyAssociation(
      admin.id,
      company.id,
      "ADMIN"
    );

    expect(association).not.toBeUndefined();
  });

  test("Administrateur et utilisateur non inscrit sur TD", async ({ page }) => {
    const NON_REGISTERED_USER_EMAIL = "utilisateurnoninscrit@yopmail.com";

    await test.step("Log in de l'administrateur", async () => {
      await successfulLogin(page, {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
      });
    });

    let userAccountHash;

    await test.step("Invitation d'un utilisateur non inscrit sur TD", async () => {
      userAccountHash = await inviteUserToCompany(page, {
        company,
        user: {
          email: NON_REGISTERED_USER_EMAIL
        },
        role: "Administrateur"
      });
    });

    await test.step("Suppression de l'invitation", async () => {
      await deleteInvitation(page, {
        company,
        user: {
          email: NON_REGISTERED_USER_EMAIL
        }
      });
    });

    await test.step("L'utilisateur invité tente d'utiliser le lien et reçoit une erreur", async () => {
      await visitExpiredInvitationLink(page, { hash: userAccountHash.hash });
    });

    await test.step("Invitation d'un utilisateur non inscrit sur TD à nouveau", async () => {
      userAccountHash = await inviteUserToCompany(page, {
        company,
        user: {
          email: NON_REGISTERED_USER_EMAIL
        },
        role: "Administrateur"
      });
    });

    await test.step("Renvoi de l'invitation", async () => {
      userAccountHash = await resendInvitation(page, {
        company,
        user: {
          email: NON_REGISTERED_USER_EMAIL
        }
      });
    });

    await test.step("L'utilisateur non inscrit sur TD visite le lien de l'invitation", async () => {
      await logout(page);

      await visitInvitationLinkAsNonRegisteredUser(page, {
        hash: userAccountHash.hash,
        email: NON_REGISTERED_USER_EMAIL
      });
    });
  });

  test("Administrateur et utilisateur inscrit sur TD", async ({ browser }) => {
    // Create two isolated browser contexts
    const adminContext = await browser.newContext();
    const userContext = await browser.newContext();

    // Create pages and interact with contexts independently
    const adminPage = await adminContext.newPage();
    const userPage = await userContext.newPage();

    // 2nd user
    const USER_NAME = "User2 e2e Roles";
    const USER_EMAIL = "user2.e2e.roles@mail.com";
    const USER_PASSWORD = "Us3r2_E2E_R0l3$$";

    let user;

    await test.step("Seed du deuxième utilisateur", async () => {
      user = await seedUser({
        name: USER_NAME,
        email: USER_EMAIL,
        password: USER_PASSWORD
      });

      expect(user).not.toBeUndefined();
    });

    await test.step("Log in de l'administrateur", async () => {
      await successfulLogin(adminPage, {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
      });
    });

    await test.step("Invitation de l'utilisateur inscrit sur TD", async () => {
      await inviteUserToCompany(adminPage, {
        company,
        user: {
          id: user.id,
          email: USER_EMAIL
        },
        role: "Administrateur"
      });
    });

    await test.step("Log in de l'utilisateur invité", async () => {
      await successfulLogin(userPage, {
        email: USER_EMAIL,
        password: USER_PASSWORD
      });
    });

    await test.step("L'utilisateur vérifie qu'il est bien admin de l'entreprise", async () => {
      await verifyCompanyAccess(userPage, {
        company,
        user,
        role: "Administrateur"
      });
    });

    await test.step("L'administrateur révoque les droits de l'utilisateur", async () => {
      await revokeAccess(adminPage, {
        company,
        user
      });
    });

    await test.step("L'utilisateur n'a plus accès à l'entreprise", async () => {
      // Refresh the page
      await userPage.reload();

      // Because user has no company, he should be redirected
      await checkCurrentURL(userPage, "/account/companies");
    });
  });
});
