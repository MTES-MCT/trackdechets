import { test, Page } from "@playwright/test";
import { seedUser } from "../data/user";
import { seedCompanyAssociations, seedDefaultCompanies } from "../data/company";
import { seedBsdd } from "../data/bsdd";
import { seedBsda } from "../data/bsda";
import { seedBsff } from "../data/bsff";
import { seedBsvhu } from "../data/bsvhu";
import { seedBsdasri } from "../data/bsdasri";
import { successfulLogin } from "../utils/user";
import { selectCompany, selectBsdMenu } from "../utils/navigation";
import {
  expectFilteredResults,
  quickFilter,
  QuickFilterLabel
} from "../utils/dashboardFilters";

interface Scenario {
  desc: string;
  in: string;
  out: any[];
}
const testScenario = async (
  page: Page,
  label: QuickFilterLabel,
  scenario: Scenario,
  defaultResults: any[]
) => {
  await test.step(scenario.desc, async () => {
    await quickFilter(page, {
      label,
      value: scenario.in
    });
    await expectFilteredResults(page, scenario.out);

    // Reset
    await quickFilter(page, { label, value: "" });
    await expectFilteredResults(page, defaultResults);
  });
};

test.describe.serial("Cahier de recette de gestion des membres", async () => {
  // Credentials
  const USER_NAME = "User e2e Filtres rapides";
  const USER_EMAIL = "user.e2e.quickfilters@mail.com";
  const USER_PASSWORD = "Us3r_E2E_QUiCKFilT3rs$$";

  // User
  let user;

  // Companies
  let companies;

  // Bsds
  let bsdd1,
    bsdd2,
    bsdd3,
    bsdd4,
    bsda1,
    bsda2,
    bsda3,
    bsff1,
    bsvhu1,
    bsdasri1,
    bsdasri2;

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

  test("Seed des bordereaux", async () => {
    // BSDDs

    bsdd1 = await seedBsdd({
      ownerId: user.id,
      status: "GROUPED", // in bsd 4
      customId: "NUM-LIBRE01",
      wasteDetailsCode: "02 01 01",
      emitterWorkSiteName: "Parking",
      recipientCap: "PAC20241520",
      // Companies
      emitter: companies.companyA,
      transporters: [companies.companyB, companies.companyC],
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

    bsdd4 = await seedBsdd({
      ownerId: user.id,
      status: "SIGNED_BY_PRODUCER",
      emitterType: "APPENDIX2",
      emitter: companies.companyD,
      recipient: companies.companyM,
      grouping: [bsdd1]
    });

    bsdd3 = await seedBsdd({
      ownerId: user.id,
      status: "PROCESSED",
      emitterType: "APPENDIX1_PRODUCER",
      emitterWorkSiteName: "Supermarché",
      emitter: companies.companyA,
      recipient: companies.companyL
    });

    bsdd2 = await seedBsdd({
      ownerId: user.id,
      emitterType: "APPENDIX1",
      status: "PROCESSED",
      emitter: companies.companyL,
      recipient: companies.companyL,
      ecoOrganisme: companies.companyF,
      transporters: [companies.companyL],
      grouping: [bsdd3]
    });

    // BSDAs

    bsda1 = await seedBsda({
      status: "PROCESSED",
      emitterPickupSiteName: "Chantier du parc",
      wasteCode: "06 13 04*",
      wasteMaterialName: "Amiante",
      emitter: companies.companyA,
      worker: companies.companyK,
      broker: companies.companyG,
      destination: companies.companyD,
      forwardedIn: {
        emitter: companies.companyJ,
        destination: companies.companyD
      }
    });

    bsda3 = await seedBsda({
      status: "SIGNED_BY_PRODUCER",
      type: "GATHERING",
      destination: companies.companyD,
      grouping: [bsda1]
    });

    bsda2 = await seedBsda({
      status: "PROCESSED",
      type: "COLLECTION_2710",
      emitter: companies.companyA,
      destination: companies.companyH
    });

    // BSFFs

    bsff1 = await seedBsff({
      status: "PROCESSED",
      type: "COLLECTE_PETITES_QUANTITES",
      destinationCap: "L326548",
      packagings: [{ numero: "CONT-202401-AB" }],
      wasteCode: "14 06 01*",
      operateur: companies.companyD,
      detenteur: companies.companyA,
      transporter: companies.companyB,
      destination: companies.companyJ
    });

    // BSVHU

    bsvhu1 = await seedBsvhu({
      status: "PROCESSED",
      transporter: companies.companyB,
      destination: companies.companyI
    });

    // BSDASRI

    bsdasri1 = await seedBsdasri({
      status: "SIGNED_BY_PRODUCER",
      emitter: companies.companyA
    });

    bsdasri2 = await seedBsdasri({
      status: "SENT",
      type: "SYNTHESIS",
      destination: companies.companyD
    });
  });

  test("Utilisateur connecté", async ({ page }) => {
    await test.step("Log in", async () => {
      await successfulLogin(page, {
        email: USER_EMAIL,
        password: USER_PASSWORD
      });
    });

    // Default results for this company, for this menu
    const DEFAULT_COMPANYA_RESULTS = [
      bsdd1,
      bsdd3,
      bsda1,
      bsda2,
      bsff1,
      bsdasri1
    ];

    await test.step("N° de BSD / contenant (et numéro libre)", async () => {
      await test.step("Entreprise A > 'Tous les bordereaux'", async () => {
        await test.step("Navigation", async () => {
          // On CompanyA's page
          await selectCompany(page, companies.companyA.siret);
          // BSD menu
          await selectBsdMenu(page, "Tous les bordereaux");
        });

        // Build & test scenarios
        const scenarios = [
          { desc: "Etat initial", in: "", out: DEFAULT_COMPANYA_RESULTS },
          {
            desc: "'NUM-LIBRE01' > bsdd1 devrait remonter",
            in: "NUM-LIBRE01",
            out: [bsdd1]
          },
          {
            desc: "ID du bsdd1 > bsdd1 devrait remonter",
            in: bsdd1.readableId,
            out: [bsdd1]
          },
          {
            desc: "ID du bsda1 > bsda1 devrait remonter",
            in: bsda1.id,
            out: [bsda1]
          },
          {
            desc: "ID du bsff1 > bsff1 devrait remonter",
            in: bsff1.id,
            out: [bsff1]
          },
          {
            desc: "ID du bsdasri1 > bsdasri1 devrait remonter",
            in: bsdasri1.id,
            out: [bsdasri1]
          },
          {
            desc: "Numéro de contenant 'CONT-202401-AB' > bsff1 devrait remonter",
            in: "CONT-202401-AB",
            out: [bsff1]
          },
          {
            desc: "'AZERTYAZERTYAZERTY' > aucun résultat",
            in: "AZERTYAZERTYAZERTY",
            out: []
          },
          {
            desc: "'BSDA-' > bsda1 & 2 devraient remonter",
            in: "BSDA-",
            out: [bsda1, bsda2]
          }
        ];

        for (const scenario of scenarios) {
          await testScenario(
            page,
            "N° de BSD / contenant",
            scenario,
            DEFAULT_COMPANYA_RESULTS
          );
        }
      });
    });

    await test.step("N° de déchet / nom usuel", async () => {
      await test.step("Entreprise A > 'Tous les bordereaux'", async () => {
        await test.step("Navigation", async () => {
          // On CompanyA's page
          await selectCompany(page, companies.companyA.siret);
          // BSD menu
          await selectBsdMenu(page, "Tous les bordereaux");
        });

        // Build & test scenarios
        const scenarios = [
          { desc: "Etat initial", in: "", out: DEFAULT_COMPANYA_RESULTS },
          {
            desc: "'02 01 01' > bsdd1 devrait remonter",
            in: "02 01 01",
            out: [bsdd1]
          },
          {
            desc: "'06 13 04*' > bsda1 devrait remonter",
            in: "06 13 04*",
            out: [bsda1]
          },
          {
            desc: "'06' > bsda1 et bsff1 devraient remonter",
            in: "06",
            out: [bsda1, bsff1]
          },
          {
            desc: "'Amiante' > bsda1 devrait remonter",
            in: "Amiante",
            out: [bsda1]
          }
        ];

        for (const scenario of scenarios) {
          await testScenario(
            page,
            "N° de déchet / nom usuel",
            scenario,
            DEFAULT_COMPANYA_RESULTS
          );
        }
      });
    });

    await test.step("Raison sociale / SIRET", async () => {
      await test.step("Entreprise A > 'Tous les bordereaux'", async () => {
        await test.step("Navigation", async () => {
          // On CompanyA's page
          await selectCompany(page, companies.companyA.siret);
          // BSD menu
          await selectBsdMenu(page, "Tous les bordereaux");
        });

        // Build & test scenarios
        const scenarios = [
          { desc: "Etat initial", in: "", out: DEFAULT_COMPANYA_RESULTS },
          {
            desc: "Siret companyA > bsdd1, bsdd3, bsda1, bsda2, bsff1 & bsdasri1 devraient remonter",
            in: companies.companyA.siret,
            out: [bsdd1, bsdd3, bsda1, bsda2, bsff1, bsdasri1]
          },
          {
            desc: "Siret companyB > bsdd1 & bsff1 devraient remonter",
            in: companies.companyB.siret,
            out: [bsdd1, bsff1]
          },
          {
            desc: "N° de TVA companyC > bsdd1 devrait remonter",
            in: companies.companyC.vatNumber,
            out: [bsdd1]
          },
          {
            desc: "Siret companyE > bsdd1 devrait remonter",
            in: companies.companyE.siret,
            out: [bsdd1]
          },
          {
            desc: "Siret companyF > bsdd1 devrait remonter",
            in: companies.companyF.siret,
            out: [bsdd1]
          },
          {
            desc: "Siret companyK > bsda1 devrait remonter",
            in: companies.companyK.siret,
            out: [bsda1]
          },
          {
            desc: "Siret companyG > bsda1 devrait remonter",
            in: companies.companyG.siret,
            out: [bsda1]
          },
          // TODO: fix
          // {  desc: "Siret companyJ > bsdd1, bsda1 & bsff1 devraient remonter", in: companies.companyJ.siret, out: [bsdd1, bsda1, bsff1] },
          // TODO: ne peut pas marcher, on est sur le profil de l'entreprise A
          // {  desc: "Siret companyD > bsdd1, bsda1 & bsff1 devraient remonter", in: companies.companyD.siret, out: [bsdd1, bsda1, bsff1] },
          {
            desc: "Siret companyH > bsda2 devrait remonter",
            in: companies.companyH.siret,
            out: [bsda2]
          }
        ];

        for (const scenario of scenarios) {
          await testScenario(
            page,
            "Raison sociale / SIRET",
            scenario,
            DEFAULT_COMPANYA_RESULTS
          );
        }
      });
    });
  });
});
