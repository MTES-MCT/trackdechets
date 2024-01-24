import { expect, test } from "@playwright/test";
import { seedCompany, seedCompanyAssociation } from "../seed/company";
import { successfulLogin } from "../utils/user";
import { seedUser } from "../seed/user";

test.describe.serial("Cahier de recette de gestion des membres", async () => {
  // User credentials
  const USER_NAME = "User e2e Roles";
  const USER_EMAIL = "user.e2e.roles@mail.com";
  const USER_PASSWORD = "Us3r_E2E_R0l3$$";
  let userId;

  test("Seed user", async () => {
    const user = await seedUser({
      name: USER_NAME,
      email: USER_EMAIL,
      password: USER_PASSWORD
    });

    expect(user).not.toBeUndefined();

    userId = user.id;
  });

  test("Seed companies", async () => {
    const company003 = await seedCompany({
      name: "003 - Producteur avec signature et emport autorisé",
      allowBsdasriTakeOverWithoutSignature: true,
      companyTypes: ["PRODUCER"]
    });

    expect(company003).not.toBeUndefined();

    const association = await seedCompanyAssociation(
      userId,
      company003.id,
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
  });
});
