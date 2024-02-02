import { expect, test } from "@playwright/test";
import { seedUser } from "../data/user";
import { seedCompanyAssociations, seedDefaultCompanies } from "../data/company";
import { BsddOpt, getBsdd, seedBsdd } from "../data/bsdd";
import { successfulLogin } from "../utils/user";

test.describe.serial("Cahier de recette de gestion des membres", async () => {
  // Credentials
  const USER_NAME = "User e2e Filtres rapides";
  const USER_EMAIL = "user.e2e.quickfilters@mail.com";
  const USER_PASSWORD = "Us3r_E2E_QUiCKFilT3rs$$";

  // User
  let user;

  // Companies
  let companies;

  test("Seed de l'utilisateur", async () => {
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

  // Annexe 1: tournée dédiée. Le transporteur va collecter plein de petits bordereaux. reprend essentiellement les données du bordereau chapeau. Les bordereaux enfants & parents peuvent changer de statut indépendamment
  // Annexe 2: exutoire qui a des bordereau non-finaux. Refait un bordereau (à base de bordereau AWAITING_GROUP) pour les renvoyer ailleurs. Seul le bordereau parent peut changer de statut

  test("Seed des bordereaux", async () => {
    const bsdd1 = await seedBsdd({
      ownerId: user.id,
      status: "GROUPED", // in bsd 4
      customId: "NUM-LIBRE01",
      wasteDetailsCode: "02 01 01",
      emitterPickupSite: "Parking", // TODO
      recipientCap: "PAC20241520",
      // Companies
      emitter: companies.companyA,
      transporters: [companies.companyB, companies.companyC], // TODO transporter étranger pas de siret
      recipientIsTempStorage: true,
      recipient: companies.companyJ,
      trader: companies.companyE,
      ecoOrganisme: companies.companyF,
      forwardedIn: {
        ownerId: user.id,
        status: "GROUPED",
        emitter: companies.companyJ,
        recipient: companies.companyD
      }
    });

    const bsdd4 = await seedBsdd({
      ownerId: user.id,
      status: "SIGNED_BY_PRODUCER",
      emitterType: "APPENDIX2",
      emitter: companies.companyD,
      recipient: companies.companyM, // TODO: n'apparaît pas
      grouping: [bsdd1]
    });

    const bsdd3 = await seedBsdd({
      ownerId: user.id,
      status: "PROCESSED",
      emitterType: "APPENDIX1_PRODUCER",
      emitterPickupSite: "Supermarché", // TODO:vérifier
      emitter: companies.companyA,
      recipient: companies.companyL // TODO: vérifier qu'il apparaît bien
    });

    const bsdd2 = await seedBsdd({
      ownerId: user.id,
      emitterType: "APPENDIX1",
      status: "PROCESSED",
      emitter: companies.companyL,
      recipient: companies.companyL,
      ecoOrganisme: companies.companyF,
      transporters: [companies.companyL],
      grouping: [bsdd3]
    });
  });

  test("Utilisateur connecté", async ({ page }) => {
    await test.step("Log in", async () => {
      await successfulLogin(page, {
        email: USER_EMAIL,
        password: USER_PASSWORD
      });
    });

    await test.step("Tableau de bord", async () => {
      expect(true).toBeTruthy();
    });
  });
});
