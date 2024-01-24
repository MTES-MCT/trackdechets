import { expect, test } from "@playwright/test";
import { seedCompany, seedCompanyAssociation } from "../data/company";
import { successfulLogin } from "../utils/user";
import {
  deleteInvitation,
  inviteUserToCompany,
  visitExpiredInvitationLink
} from "../utils/roles";
import { seedUser } from "../data/user";

test.describe.serial("Cahier de recette de gestion des membres", async () => {
  // User credentials
  const USER_NAME = "User e2e Roles";
  const USER_EMAIL = "user.e2e.roles@mail.com";
  const USER_PASSWORD = "Us3r_E2E_R0l3$$";

  // Seeded data
  let user;
  let company;

  test("Seed user", async () => {
    user = await seedUser({
      name: USER_NAME,
      email: USER_EMAIL,
      password: USER_PASSWORD
    });

    expect(user).not.toBeUndefined();
  });

  test("Seed companies", async () => {
    company = await seedCompany({
      name: "Producteur avec signature et emport autorisé",
      allowBsdasriTakeOverWithoutSignature: true,
      companyTypes: ["PRODUCER"]
    });

    expect(company).not.toBeUndefined();

    const association = await seedCompanyAssociation(
      user.id,
      company.id,
      "ADMIN"
    );

    expect(association).not.toBeUndefined();
  });

  test("Utilisateur connecté", async ({ page }) => {
    await test.step("Log in", async () => {
      await successfulLogin(page, {
        email: USER_EMAIL,
        password: USER_PASSWORD
      });
    });

    let userAccountHash;

    await test.step("Invitation d'un utilisateur non inscrit sur TD", async () => {
      userAccountHash = await inviteUserToCompany(page, {
        company,
        user: {
          email: "utilisateurnoninscrit@yopmail.com"
        },
        role: "Administrateur"
      });
    });

    await test.step("Suppression de l'invitation", async () => {
      await deleteInvitation(page, {
        company,
        user: {
          email: "utilisateurnoninscrit@yopmail.com"
        }
      });
    });

    await test.step("L'utilisateur invité tente d'utiliser le lien et reçoit une erreur", async () => {
      await visitExpiredInvitationLink(page, { hash: userAccountHash.hash });
    });
  });
});
