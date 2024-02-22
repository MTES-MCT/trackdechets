import { test, Page } from "@playwright/test";
import { Company } from "@prisma/client";
import { seedUser } from "../data/user";
import { seedCompanyAssociations, seedDefaultCompanies } from "../data/company";
import { seedBsdd, seedFormGroupment } from "../data/bsdd";
import { seedBsda } from "../data/bsda";
import { seedBsff } from "../data/bsff";
import { seedBsvhu } from "../data/bsvhu";
import { seedBsdasri } from "../data/bsdasri";
import { successfulLogin } from "../utils/user";
import { selectCompany, selectBsdMenu, BsdMenu } from "../utils/navigation";
import {
  expectFilteredResults,
  expectQuickFilterValue,
  quickFilter,
  QuickFilterLabel
} from "../utils/dashboardFilters";

test.describe.serial("Cahier des filtres rapides", async () => {
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
      recipient: companies.companyJ,
      trader: companies.companyE,
      ecoOrganisme: companies.companyF,
      nextDestination: companies.companyD
    });

    bsdd4 = await seedBsdd({
      ownerId: user.id,
      status: "SIGNED_BY_PRODUCER",
      emitterType: "APPENDIX2",
      emitter: companies.companyJ,
      recipient: companies.companyM
    });

    await seedFormGroupment(bsdd1, bsdd4);

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
      transporters: [companies.companyL]
    });

    // BSDAs

    bsda1 = await seedBsda({
      status: "AWAITING_CHILD",
      emitterPickupSiteName: "Chantier du parc",
      wasteCode: "06 13 04*",
      wasteMaterialName: "Amiante",
      emitter: companies.companyA,
      worker: companies.companyK,
      broker: companies.companyG,
      destination: companies.companyJ,
      destinationOperationNextDestination: companies.companyD,
      groupedIn: {
        emitter: companies.companyJ,
        destination: companies.companyD
      }
    });

    bsda3 = await seedBsda({
      status: "SIGNED_BY_PRODUCER",
      type: "GATHERING",
      emitter: companies.companyJ,
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
      emitter: companies.companyD,
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

  interface Scenario {
    company?: Company;
    bsdMenu?: BsdMenu;
    desc: string;
    in: string;
    out: any[];
    resetResults?: any[];
  }
  const testScenario = async (
    page: Page,
    label: QuickFilterLabel,
    scenario: Scenario,
    defaultCompanyResults: any[]
  ) => {
    const bsdMenu = scenario.bsdMenu ?? "Tous les bordereaux";
    const company = scenario.company ?? companies.companyA;

    await test.step(`[Entreprise "${company.name}" | Onglet "${bsdMenu}"] ${scenario.desc}`, async () => {
      // Select correct company & bsd menu
      await selectCompany(page, company.siret ?? company.vatNumber);
      await selectBsdMenu(page, bsdMenu);

      // Test scenario
      await quickFilter(page, {
        label,
        value: scenario.in
      });
      await expectFilteredResults(page, scenario.out);

      // Test reset
      await quickFilter(page, { label, value: "" });
      await expectFilteredResults(page, defaultCompanyResults);
    });
  };

  const testScenarios = async (
    page: Page,
    scenarios: Scenario[],
    label: QuickFilterLabel,
    resetResults: any[]
  ) => {
    for (const scenario of scenarios) {
      await testScenario(
        page,
        label,
        scenario,
        scenario.resetResults ?? resetResults
      );
    }
  };

  test("Utilisateur connecté", async ({ page }) => {
    await test.step("Log in", async () => {
      await successfulLogin(page, {
        email: USER_EMAIL,
        password: USER_PASSWORD
      });
    });

    const DEFAULT_COMPANY_A_RESULTS = [
      bsdd1,
      bsdd3,
      bsda1,
      bsda2,
      bsff1,
      bsdasri1
    ];
    const DEFAULT_COMPANY_D_RESULTS = [bsda1, bsda3, bsff1, bsdasri2];
    const DEFAULT_COMPANY_F_RESULTS = [bsdd1, bsdd2];
    const DEFAULT_COMPANY_I_RESULTS = [bsvhu1];
    const DEFAULT_COMPANY_J_RESULTS = [bsdd1, bsdd4, bsda1, bsda3, bsff1];

    await test.step("N° libre / BSD / contenant (et numéro libre)", async () => {
      const scenarios = [
        {
          desc: "Etat initial",
          in: "",
          out: DEFAULT_COMPANY_A_RESULTS
        },
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
        },
        {
          company: companies.companyI,
          desc: "Pas de filtre > bsvhu1 devrait remonter",
          in: "",
          out: DEFAULT_COMPANY_I_RESULTS,
          resetResults: DEFAULT_COMPANY_I_RESULTS
        },
        {
          company: companies.companyI,
          desc: "ID du bsda1 > aucun résultat ne devrait remonter",
          in: bsda1.id,
          out: [],
          resetResults: DEFAULT_COMPANY_I_RESULTS
        }
      ];

      await testScenarios(
        page,
        scenarios,
        "N° libre / BSD / contenant",
        DEFAULT_COMPANY_A_RESULTS
      );
    });

    await test.step("N° de déchet / nom usuel", async () => {
      const scenarios = [
        { desc: "Etat initial", in: "", out: DEFAULT_COMPANY_A_RESULTS },
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

      await testScenarios(
        page,
        scenarios,
        "N° de déchet / nom usuel",
        DEFAULT_COMPANY_A_RESULTS
      );
    });

    await test.step("Raison sociale / SIRET", async () => {
      const scenarios = [
        { desc: "Etat initial", in: "", out: DEFAULT_COMPANY_A_RESULTS },
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
        {
          desc: "Siret companyJ > bsdd1, bsda1 & bsff1 devraient remonter",
          in: companies.companyJ.siret,
          out: [bsdd1, bsda1, bsff1]
        },
        {
          desc: "Siret companyD > bsdd1, bsda1 & bsff1 devraient remonter",
          in: companies.companyD.siret,
          out: [bsdd1, bsda1, bsff1]
        },
        {
          desc: "Siret companyH > bsda2 devrait remonter",
          in: companies.companyH.siret,
          out: [bsda2]
        },
        {
          company: companies.companyI,
          desc: "N° de TVA companyC > bsvhu1 devrait remonter",
          in: companies.companyC.vatNumber,
          out: [bsvhu1],
          resetResults: DEFAULT_COMPANY_I_RESULTS
        },
        {
          company: companies.companyI,
          desc: "Siret companyI > bsvhu1 devrait remonter",
          in: companies.companyI.siret,
          out: [bsvhu1],
          resetResults: DEFAULT_COMPANY_I_RESULTS
        },
        {
          company: companies.companyF,
          desc: "Siret companyL > bsdd2 devrait remonter",
          in: companies.companyL.siret,
          out: [bsdd2],
          resetResults: DEFAULT_COMPANY_F_RESULTS
        },
        {
          company: companies.companyJ,
          desc: "Siret companyM > bsdd4 devrait remonter",
          in: companies.companyM.siret,
          out: [bsdd4],
          resetResults: DEFAULT_COMPANY_J_RESULTS
        },
        {
          company: companies.companyD,
          desc: "Siret companyD > bsdd4 devrait remonter",
          in: companies.companyD.siret,
          out: DEFAULT_COMPANY_D_RESULTS,
          resetResults: DEFAULT_COMPANY_D_RESULTS
        }
      ];

      await testScenarios(
        page,
        scenarios,
        "Raison sociale / SIRET",
        DEFAULT_COMPANY_A_RESULTS
      );
    });

    await test.step("Numéro de CAP", async () => {
      const scenarios = [
        { desc: "Etat initial", in: "", out: DEFAULT_COMPANY_A_RESULTS },
        {
          desc: '"PAC20241520" > bsdd1 devrait remonter',
          in: "PAC20241520",
          out: [bsdd1]
        },
        { desc: '"L" > bsff1 devrait remonter', in: "L", out: [bsff1] },
        {
          desc: '"AZERTYAZERTYAZERTY" > aucun bsd ne devrait remonter',
          in: "AZERTYAZERTYAZERTY",
          out: []
        }
      ];

      await testScenarios(
        page,
        scenarios,
        "Numéro de CAP",
        DEFAULT_COMPANY_A_RESULTS
      );
    });

    await test.step("Nom de chantier", async () => {
      const scenarios = [
        { desc: "Etat initial", in: "", out: DEFAULT_COMPANY_A_RESULTS },
        {
          desc: '"Chantier du parc" > bsda1 devrait remonter',
          in: "Chantier du parc",
          out: [bsda1]
        },
        {
          desc: '"Supermarché" > bsdd3 devrait remonter',
          in: "Supermarché",
          out: [bsdd3]
        },
        {
          desc: '"Parking" > bsdd1 devrait remonter',
          in: "Parking",
          out: [bsdd1]
        },
        {
          desc: '"N" > bsdd1 & bsda1 devrait remonter',
          in: "N",
          out: [bsdd1, bsda1]
        }
      ];

      await testScenarios(
        page,
        scenarios,
        "Nom de chantier",
        DEFAULT_COMPANY_A_RESULTS
      );
    });

    await test.step("Filtres rapides multiples", async () => {
      await test.step(`[Entreprise "${companies.companyA.name}" | Onglet "Tous les bordereaux"] Filtre 'BSDA-' + Nom de chantier 'parc' > bsda1 devrait remonter`, async () => {
        // Select correct company & bsd menu
        await selectCompany(page, companies.companyA.siret);
        await selectBsdMenu(page, "Tous les bordereaux");
        await expectFilteredResults(page, DEFAULT_COMPANY_A_RESULTS);

        // User 1st filter
        await quickFilter(page, {
          label: "N° libre / BSD / contenant",
          value: "BSDA-"
        });
        await expectFilteredResults(page, [bsda1, bsda2]);

        // Combine with 2nd filter
        await quickFilter(page, {
          label: "Nom de chantier",
          value: "parc"
        });
        await expectFilteredResults(page, [bsda1]);

        // Test reset
        await quickFilter(page, { label: "Nom de chantier", value: "" });
        await quickFilter(page, {
          label: "N° libre / BSD / contenant",
          value: ""
        });
        await expectFilteredResults(page, DEFAULT_COMPANY_A_RESULTS);
      });
    });

    await test.step("Filtres rapides à travers les différents menus & entreprises", async () => {
      await test.step(`[Entreprise "${companies.companyA.name}"] Changement d'onglet et d'entreprise > le filtre est toujours présent`, async () => {
        // Select correct company & bsd menu
        await selectCompany(page, companies.companyA.siret);
        await selectBsdMenu(page, "Tous les bordereaux");
        await expectFilteredResults(page, DEFAULT_COMPANY_A_RESULTS);

        // User filter
        await quickFilter(page, {
          label: "N° libre / BSD / contenant",
          value: "BSDA-"
        });
        await expectFilteredResults(page, [bsda1, bsda2]);

        // Change to another menu. Filter should still be filled, and results
        // filtered accordingly
        await selectBsdMenu(page, "Suivi");
        await expectQuickFilterValue(page, {
          label: "N° libre / BSD / contenant",
          value: "BSDA-"
        });
        await expectFilteredResults(page, [bsda1]);

        // And another one
        await selectBsdMenu(page, "Archives");
        await expectQuickFilterValue(page, {
          label: "N° libre / BSD / contenant",
          value: "BSDA-"
        });
        await expectFilteredResults(page, [bsda2]);

        // Change to another company. Filter should still be filled, and results
        // filtered accordingly
        await selectCompany(page, companies.companyJ.siret);
        await expectQuickFilterValue(page, {
          label: "N° libre / BSD / contenant",
          value: "BSDA-"
        });
        await expectFilteredResults(page, [bsda1, bsda3]);
      });
    });
  });
});
