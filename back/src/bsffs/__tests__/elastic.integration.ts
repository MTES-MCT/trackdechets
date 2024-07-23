import { resetDatabase } from "../../../integration-tests/helper";
import {
  UserWithCompany,
  userWithCompanyFactory
} from "../../__tests__/factories";
import {
  BsffForElasticInclude,
  getBsffForElastic,
  getOrgIdsByTab,
  toBsdElastic
} from "../elastic";
import { BsdElastic } from "../../common/elastic";
import {
  addBsffTransporter,
  createBsff,
  createBsffAfterAcceptation,
  createBsffAfterEmission,
  createBsffAfterOperation,
  createBsffAfterReception,
  createBsffAfterTransport,
  createFicheIntervention
} from "./factories";
import { prisma } from "@td/prisma";
import { BsffFicheIntervention } from "@prisma/client";

describe("getOrgIdsByTab", () => {
  let emitter: UserWithCompany;
  let transporter: UserWithCompany;
  let transporter2: UserWithCompany;
  let destination: UserWithCompany;
  let detenteur: UserWithCompany;
  let ficheIntervention: BsffFicheIntervention;

  beforeEach(async () => {
    emitter = await userWithCompanyFactory();
    transporter = await userWithCompanyFactory();
    transporter2 = await userWithCompanyFactory();
    destination = await userWithCompanyFactory();
    detenteur = await userWithCompanyFactory();
    ficheIntervention = await prisma.bsffFicheIntervention.create({
      data: {
        numero: "FI",
        detenteurCompanySiret: detenteur.company.siret,
        detenteurCompanyName: detenteur.company.name,
        detenteurCompanyAddress: detenteur.company.address!,
        weight: 1,
        postalCode: "13001",
        operateurCompanySiret: emitter.company.siret!,
        operateurCompanyName: emitter.company.name,
        operateurCompanyAddress: emitter.company.address!,
        operateurCompanyContact: emitter.company.contact!,
        operateurCompanyMail: emitter.company.contactEmail!,
        operateurCompanyPhone: emitter.company.contactPhone!
      }
    });
  });

  afterEach(resetDatabase);

  test("status INITIAL (isDraft=true)", async () => {
    const bsff = await createBsff(
      { emitter, destination },
      {
        data: {
          isDraft: true,
          ficheInterventions: { connect: { id: ficheIntervention.id } },
          transporters: {
            create: [
              { transporterCompanySiret: transporter.company.siret, number: 1 },
              { transporterCompanySiret: transporter2.company.siret, number: 2 }
            ]
          }
        }
      }
    );

    const { isDraftFor } = getOrgIdsByTab(bsff);
    expect(isDraftFor).toContain(emitter.company.siret);
    expect(isDraftFor).toContain(transporter.company.siret);
    expect(isDraftFor).toContain(transporter2.company.siret);
    expect(isDraftFor).toContain(destination.company.siret);
    expect(isDraftFor).toContain(detenteur.company.siret);
  });

  test("status INITIAL (isDraft=false)", async () => {
    const bsff = await createBsff(
      { emitter, destination },
      {
        data: {
          ficheInterventions: { connect: { id: ficheIntervention.id } },
          transporters: {
            create: [
              { transporterCompanySiret: transporter.company.siret, number: 1 },
              { transporterCompanySiret: transporter2.company.siret, number: 2 }
            ]
          }
        }
      }
    );

    const { isForActionFor, isFollowFor } = getOrgIdsByTab(bsff);
    expect(isForActionFor).toContain(emitter.company.siret);
    expect(isFollowFor).toContain(transporter.company.siret);
    expect(isFollowFor).toContain(transporter2.company.siret);
    expect(isFollowFor).toContain(destination.company.siret);
    expect(isFollowFor).toContain(detenteur.company.siret);
  });

  test("status SIGNED_BY_EMITTER", async () => {
    const bsff = await createBsffAfterEmission(
      { emitter, destination },
      {
        data: {
          ficheInterventions: { connect: { id: ficheIntervention.id } },
          transporters: {
            create: [
              { transporterCompanySiret: transporter.company.siret, number: 1 },
              { transporterCompanySiret: transporter2.company.siret, number: 2 }
            ]
          }
        }
      }
    );

    const { isFollowFor, isToCollectFor } = getOrgIdsByTab(bsff);
    expect(isFollowFor).toContain(emitter.company.siret);
    expect(isToCollectFor).toContain(transporter.company.siret);
    expect(isFollowFor).toContain(transporter2.company.siret);
    expect(isFollowFor).toContain(destination.company.siret);
    expect(isFollowFor).toContain(detenteur.company.siret);
  });

  test("status SENT (first transporter has signed)", async () => {
    const createdBsff = await createBsffAfterTransport(
      { emitter, transporter, destination },
      {
        data: {
          ficheInterventions: { connect: { id: ficheIntervention.id } }
        }
      }
    );

    await addBsffTransporter({
      bsffId: createdBsff.id,
      transporter: transporter2
    });

    const bsff = await prisma.bsff.findUniqueOrThrow({
      where: { id: createdBsff.id },
      include: BsffForElasticInclude
    });

    const { isFollowFor, isForActionFor, isCollectedFor, isToCollectFor } =
      getOrgIdsByTab(bsff);
    expect(isFollowFor).toContain(emitter.company.siret);
    expect(isCollectedFor).toContain(transporter.company.siret);
    expect(isToCollectFor).toContain(transporter2.company.siret);
    // permet une réception anticipé même si le transporteur n°2 n'a pas signé
    expect(isForActionFor).toContain(destination.company.siret);
    expect(isFollowFor).toContain(detenteur.company.siret);
  });

  test("status SENT (second transporter has signed)", async () => {
    const createdBsff = await createBsffAfterTransport(
      { emitter, transporter, destination },
      {
        data: {
          ficheInterventions: { connect: { id: ficheIntervention.id } }
        }
      }
    );

    const bsffTransporter = await addBsffTransporter({
      bsffId: createdBsff.id,
      transporter: transporter2
    });

    const bsff = await prisma.bsff.update({
      where: { id: createdBsff.id },
      data: {
        transporters: {
          update: {
            where: { id: bsffTransporter.id },
            data: {
              transporterTransportSignatureDate: new Date(),
              transporterTransportSignatureAuthor: "Michel"
            }
          }
        }
      },
      include: BsffForElasticInclude
    });

    const { isFollowFor, isForActionFor, isCollectedFor } =
      getOrgIdsByTab(bsff);
    expect(isFollowFor).toContain(emitter.company.siret);
    expect(isFollowFor).toContain(transporter.company.siret);
    expect(isCollectedFor).toContain(transporter2.company.siret);
    expect(isForActionFor).toContain(destination.company.siret);
    expect(isFollowFor).toContain(detenteur.company.siret);
  });

  test("status RECEIVED", async () => {
    const createdBsff = await createBsffAfterReception(
      { emitter, transporter, destination },
      {
        data: {
          ficheInterventions: { connect: { id: ficheIntervention.id } }
        }
      }
    );
    await addBsffTransporter({
      bsffId: createdBsff.id,
      transporter: transporter2
    });

    const bsff = await prisma.bsff.findUniqueOrThrow({
      where: { id: createdBsff.id },
      include: BsffForElasticInclude
    });

    const { isFollowFor, isForActionFor } = getOrgIdsByTab(bsff);
    expect(isFollowFor).toContain(emitter.company.siret);
    expect(isFollowFor).toContain(transporter.company.siret);
    expect(isFollowFor).toContain(transporter2.company.siret);
    expect(isForActionFor).toContain(destination.company.siret);
    expect(isFollowFor).toContain(detenteur.company.siret);
  });

  test("status ACCEPTED", async () => {
    const bsff = await createBsffAfterAcceptation(
      { emitter, transporter, destination },
      {
        data: {
          ficheInterventions: { connect: { id: ficheIntervention.id } }
        }
      }
    );
    const { isFollowFor, isForActionFor } = getOrgIdsByTab(bsff);
    expect(isFollowFor).toContain(emitter.company.siret);
    expect(isFollowFor).toContain(transporter.company.siret);
    expect(isForActionFor).toContain(destination.company.siret);
    expect(isFollowFor).toContain(detenteur.company.siret);
  });

  test("status PROCESSED", async () => {
    const bsff = await createBsffAfterOperation(
      { emitter, transporter, destination },
      {
        data: {
          ficheInterventions: { connect: { id: ficheIntervention.id } }
        }
      }
    );
    const { isArchivedFor } = getOrgIdsByTab(bsff);
    expect(isArchivedFor).toContain(emitter.company.siret);
    expect(isArchivedFor).toContain(transporter.company.siret);
    expect(isArchivedFor).toContain(destination.company.siret);
    expect(isArchivedFor).toContain(detenteur.company.siret);
  });

  test("status INTERMEDIATELY_PROCESSED", async () => {
    const bsff = await createBsffAfterOperation(
      { emitter, transporter, destination },
      {
        data: {
          status: "INTERMEDIATELY_PROCESSED",
          ficheInterventions: { connect: { id: ficheIntervention.id } }
        },
        packagingData: { operationCode: "R13" }
      }
    );
    const { isFollowFor } = getOrgIdsByTab(bsff);
    expect(isFollowFor).toContain(emitter.company.siret);
    expect(isFollowFor).toContain(transporter.company.siret);
    expect(isFollowFor).toContain(destination.company.siret);
    expect(isFollowFor).toContain(detenteur.company.siret);
  });
});

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
    expect(elasticBsff.companyOrgIds).toContain(transporter.company.vatNumber);
    expect(elasticBsff.companyOrgIds).toContain(destination.company.siret);
    expect(elasticBsff.companyOrgIds).toContain(detenteur1.company.siret);
    expect(elasticBsff.companyOrgIds).toContain(detenteur2.company.siret);
  });
});
