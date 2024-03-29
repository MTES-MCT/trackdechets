import { resetDatabase } from "../../../integration-tests/helper";
import {
  UserWithCompany,
  userWithCompanyFactory
} from "../../__tests__/factories";
import { getBsffForElastic, toBsdElastic } from "../elastic";
import { BsdElastic } from "../../common/elastic";
import { createBsff, createFicheIntervention } from "./factories";
import { prisma } from "@td/prisma";

describe("toBsdElastic > companies Names & OrgIds", () => {
  afterEach(resetDatabase);

  let emitter: UserWithCompany;
  let transporter: UserWithCompany;
  let destination: UserWithCompany;
  let detenteur1: UserWithCompany;
  let detenteur2: UserWithCompany;
  let bsff: any;
  let elasticBsff: BsdElastic;

  beforeAll(async () => {
    // Given
    emitter = await userWithCompanyFactory("ADMIN", { name: "Emitter" });
    transporter = await userWithCompanyFactory("ADMIN", {
      name: "Transporter",
      vatNumber: "VAT Transporter"
    });
    destination = await userWithCompanyFactory("ADMIN", {
      name: "Destination"
    });

    detenteur1 = await userWithCompanyFactory("MEMBER", {
      name: "Détenteur 1"
    });
    detenteur2 = await userWithCompanyFactory("MEMBER", {
      name: "Détenteur 2"
    });
    const ficheIntervention1 = await createFicheIntervention({
      operateur: emitter,
      detenteur: detenteur1
    });
    const ficheIntervention2 = await createFicheIntervention({
      operateur: emitter,
      detenteur: detenteur2
    });

    bsff = await createBsff({
      emitter,
      transporter,
      destination
    });
    await prisma.bsff.update({
      where: { id: bsff.id },
      data: {
        ficheInterventions: {
          connect: [
            { id: ficheIntervention1.id },
            { id: ficheIntervention2.id }
          ]
        }
      }
    });

    const bsffForElastic = await getBsffForElastic(bsff);

    // When
    elasticBsff = toBsdElastic(bsffForElastic);
  });

  test("companyNames > should contain the names of ALL BSFF companies", async () => {
    // Then
    expect(elasticBsff.companyNames).toContain(emitter.company.name);
    expect(elasticBsff.companyNames).toContain(transporter.company.name);
    expect(elasticBsff.companyNames).toContain(destination.company.name);
    expect(elasticBsff.companyNames).toContain(destination.company.name);
    expect(elasticBsff.companyNames).toContain(detenteur1.company.name);
    expect(elasticBsff.companyNames).toContain(detenteur2.company.name);
  });

  test("companyOrgIds > should contain the orgIds of ALL BSFF companies", async () => {
    // Then
    expect(elasticBsff.companyOrgIds).toContain(emitter.company.siret);
    expect(elasticBsff.companyOrgIds).toContain(transporter.company.siret);
    expect(elasticBsff.companyOrgIds).toContain(transporter.company.vatNumber);
    expect(elasticBsff.companyOrgIds).toContain(destination.company.siret);
    expect(elasticBsff.companyOrgIds).toContain(detenteur1.company.siret);
    expect(elasticBsff.companyOrgIds).toContain(detenteur2.company.siret);
  });
});
