import { test } from "@playwright/test";
import { successfulLogin } from "../../utils/user";
import { seedUser } from "../../data/user";
import {
  seedDefaultCompanies,
  seedCompanyAssociations
} from "../../data/company";
import { selectCompany } from "../../utils/navigation";
import { createBsvhu } from "../../utils/bsvhu";

test.describe.serial("Cahier de recette de création des BSVHU", async () => {
  // User credentials
  const USER_NAME = "User e2e Create BSVHU";
  const USER_EMAIL = "user.e2e.create.bsvhu@mail.com";
  const USER_PASSWORD = "Us3r_E2E_Cre4te_BSVHU$$";

  // User
  let user;

  // Companies
  let companies;

  test("Seed user", async () => {
    user = await seedUser({
      name: USER_NAME,
      email: USER_EMAIL,
      password: USER_PASSWORD
    });
  });

  test("Seed des entreprises", async () => {
    companies = await seedDefaultCompanies();

    await seedCompanyAssociations(user.id, Object.values(companies), "ADMIN");
  });

  test("Utilisateur connecté", async ({ page }) => {
    await test.step("Log in", async () => {
      await successfulLogin(page, {
        email: USER_EMAIL,
        password: USER_PASSWORD
      });
    });

    await test.step("Création d'un BSVHU", async () => {
      await selectCompany(page, companies.companyN.siret);

      await createBsvhu(page, {
        emitter: companies.companyN,
        transporter: companies.companyB
      });
    });
  });
});
