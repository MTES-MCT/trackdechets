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
import {
  BsffFicheIntervention,
  BsffStatus,
  WasteAcceptationStatus
} from "@prisma/client";
import { xDaysAgo } from "../../utils";

describe("getOrgIdsByTab", () => {
  let emitter: UserWithCompany;
  let transporter: UserWithCompany;
  let transporter2: UserWithCompany;
  let destination: UserWithCompany;
  let detenteur: UserWithCompany;
  let detenteur2: UserWithCompany;
  let ficheIntervention: BsffFicheIntervention;
  let ficheIntervention2: BsffFicheIntervention;

  beforeEach(async () => {
    emitter = await userWithCompanyFactory();
    transporter = await userWithCompanyFactory();
    transporter2 = await userWithCompanyFactory();
    destination = await userWithCompanyFactory();
    detenteur = await userWithCompanyFactory();
    detenteur2 = await userWithCompanyFactory();
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
    ficheIntervention2 = await prisma.bsffFicheIntervention.create({
      data: {
        numero: "FI2",
        detenteurCompanySiret: detenteur2.company.siret,
        detenteurCompanyName: detenteur2.company.name,
        detenteurCompanyAddress: detenteur2.company.address!,
        weight: 7,
        postalCode: "31100",
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

  test.each(["emitter", "destination", "transporter", "transporter2"])(
    "status INITIAL (isDraft=true) role: %p",
    async role => {
      const roles = {
        emitter,
        destination,
        transporter,
        transporter2
        // detenteur should not be able to access a draft bsff if only mentionned on the fiche
      };

      const bsff = await createBsff(
        { emitter, destination },
        {
          data: {
            isDraft: true,
            ficheInterventions: { connect: { id: ficheIntervention.id } },
            transporters: {
              create: [
                {
                  transporterCompanySiret: transporter.company.siret,
                  number: 1
                },
                {
                  transporterCompanySiret: transporter2.company.siret,
                  number: 2
                }
              ]
            }
          },
          packagingData: {
            ficheInterventions: { connect: { id: ficheIntervention2.id } }
          },
          userId: roles[role].user.id
        }
      );

      const { isDraftFor } = getOrgIdsByTab(bsff);
      expect(isDraftFor).toEqual([roles[role].company.siret]);
    }
  );

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
        },
        packagingData: {
          ficheInterventions: { connect: { id: ficheIntervention2.id } }
        }
      }
    );

    const { isForActionFor, isFollowFor } = getOrgIdsByTab(bsff);
    expect(isForActionFor).toContain(emitter.company.siret);
    expect(isFollowFor).toContain(transporter.company.siret);
    expect(isFollowFor).toContain(transporter2.company.siret);
    expect(isFollowFor).toContain(destination.company.siret);
    expect(isFollowFor).toContain(detenteur.company.siret);
    expect(isFollowFor).toContain(detenteur2.company.siret);
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
        },
        packagingData: {
          ficheInterventions: { connect: { id: ficheIntervention2.id } }
        }
      }
    );

    const { isFollowFor, isToCollectFor } = getOrgIdsByTab(bsff);
    expect(isFollowFor).toContain(emitter.company.siret);
    expect(isToCollectFor).toContain(transporter.company.siret);
    expect(isFollowFor).toContain(transporter2.company.siret);
    expect(isFollowFor).toContain(destination.company.siret);
    expect(isFollowFor).toContain(detenteur.company.siret);
    expect(isFollowFor).toContain(detenteur2.company.siret);
  });

  test("status SENT (first transporter has signed)", async () => {
    const createdBsff = await createBsffAfterTransport(
      { emitter, transporter, destination },
      {
        data: {
          ficheInterventions: { connect: { id: ficheIntervention.id } }
        },
        packagingData: {
          ficheInterventions: { connect: { id: ficheIntervention2.id } }
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
    expect(isFollowFor).toContain(detenteur2.company.siret);
  });

  test("status SENT (second transporter has signed)", async () => {
    const createdBsff = await createBsffAfterTransport(
      { emitter, transporter, destination },
      {
        data: {
          ficheInterventions: { connect: { id: ficheIntervention.id } }
        },
        packagingData: {
          ficheInterventions: { connect: { id: ficheIntervention2.id } }
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
    expect(isFollowFor).toContain(detenteur2.company.siret);
  });

  test("status RECEIVED", async () => {
    const createdBsff = await createBsffAfterReception(
      { emitter, transporter, destination },
      {
        data: {
          ficheInterventions: { connect: { id: ficheIntervention.id } }
        },
        packagingData: {
          ficheInterventions: { connect: { id: ficheIntervention2.id } }
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
    expect(isFollowFor).toContain(detenteur2.company.siret);
  });

  test("status ACCEPTED", async () => {
    const bsff = await createBsffAfterAcceptation(
      { emitter, transporter, destination },
      {
        data: {
          ficheInterventions: { connect: { id: ficheIntervention.id } }
        },
        packagingData: {
          ficheInterventions: { connect: { id: ficheIntervention2.id } }
        }
      }
    );
    const { isFollowFor, isForActionFor } = getOrgIdsByTab(bsff);
    expect(isFollowFor).toContain(emitter.company.siret);
    expect(isFollowFor).toContain(transporter.company.siret);
    expect(isForActionFor).toContain(destination.company.siret);
    expect(isFollowFor).toContain(detenteur.company.siret);
    expect(isFollowFor).toContain(detenteur2.company.siret);
  });

  test("status PROCESSED", async () => {
    const bsff = await createBsffAfterOperation(
      { emitter, transporter, destination },
      {
        data: {
          ficheInterventions: { connect: { id: ficheIntervention.id } }
        },
        packagingData: {
          ficheInterventions: { connect: { id: ficheIntervention2.id } }
        }
      }
    );
    const { isArchivedFor } = getOrgIdsByTab(bsff);
    expect(isArchivedFor).toContain(emitter.company.siret);
    expect(isArchivedFor).toContain(transporter.company.siret);
    expect(isArchivedFor).toContain(destination.company.siret);
    expect(isArchivedFor).toContain(detenteur.company.siret);
    expect(isArchivedFor).toContain(detenteur2.company.siret);
  });

  test("status INTERMEDIATELY_PROCESSED", async () => {
    const bsff = await createBsffAfterOperation(
      { emitter, transporter, destination },
      {
        data: {
          status: "INTERMEDIATELY_PROCESSED",
          ficheInterventions: { connect: { id: ficheIntervention.id } }
        },
        packagingData: {
          operationCode: "R13",
          ficheInterventions: { connect: { id: ficheIntervention2.id } }
        }
      }
    );
    const { isFollowFor } = getOrgIdsByTab(bsff);
    expect(isFollowFor).toContain(emitter.company.siret);
    expect(isFollowFor).toContain(transporter.company.siret);
    expect(isFollowFor).toContain(destination.company.siret);
    expect(isFollowFor).toContain(detenteur.company.siret);
    expect(isFollowFor).toContain(detenteur2.company.siret);
  });

  describe("isReturnFor", () => {
    it.each([
      WasteAcceptationStatus.REFUSED,
      WasteAcceptationStatus.PARTIALLY_REFUSED
    ])(
      "waste acceptation status is %p > bsff should belong to tab",
      async acceptationStatus => {
        // Given
        const bsff = await createBsffAfterOperation(
          { emitter, transporter, destination },
          {
            data: {
              destinationReceptionDate: new Date()
            },
            packagingData: {
              acceptationStatus
            }
          }
        );

        // When
        const { isReturnFor } = toBsdElastic(bsff);

        // Then
        expect(isReturnFor).toContain(transporter.company.siret);
      }
    );

    it("status is REFUSED > bsff should belong to tab", async () => {
      // Given
      const bsff = await createBsffAfterOperation(
        { emitter, transporter, destination },
        {
          data: {
            status: BsffStatus.REFUSED,
            destinationReceptionDate: new Date()
          }
        }
      );

      // When
      const { isReturnFor } = toBsdElastic(bsff);

      // Then
      expect(isReturnFor).toContain(transporter.company.siret);
    });

    it("waste acceptation status is ACCEPTED > bsff should not belong to tab", async () => {
      // Given
      const bsff = await createBsffAfterOperation(
        { emitter, transporter, destination },
        {
          data: {
            destinationReceptionDate: new Date()
          },
          packagingData: {
            acceptationStatus: WasteAcceptationStatus.ACCEPTED
          }
        }
      );

      // When
      const { isReturnFor } = toBsdElastic(bsff);

      // Then
      expect(isReturnFor).toStrictEqual([]);
    });

    it("bsda has been received too long ago > should not belong to tab", async () => {
      // Given
      const bsff = await createBsffAfterOperation(
        { emitter, transporter, destination },
        {
          data: {
            destinationReceptionDate: xDaysAgo(new Date(), 10)
          },
          packagingData: {
            acceptationStatus: WasteAcceptationStatus.REFUSED
          }
        }
      );

      // When
      const { isReturnFor } = toBsdElastic(bsff);

      // Then
      expect(isReturnFor).toStrictEqual([]);
    });
  });
});

describe("toBsdElastic > companies Names & OrgIds", () => {
  afterEach(resetDatabase);

  let emitter: UserWithCompany;
  let transporter: UserWithCompany;
  let destination: UserWithCompany;
  let detenteur1: UserWithCompany;
  let detenteur2: UserWithCompany;
  let detenteur3: UserWithCompany;
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
    detenteur3 = await userWithCompanyFactory("MEMBER", {
      name: "Détenteur 3"
    });
    const ficheIntervention1 = await createFicheIntervention({
      operateur: emitter,
      detenteur: detenteur1
    });
    const ficheIntervention2 = await createFicheIntervention({
      operateur: emitter,
      detenteur: detenteur2
    });
    const ficheIntervention3 = await createFicheIntervention({
      operateur: emitter,
      detenteur: detenteur3
    });

    bsff = await createBsff(
      {
        emitter,
        transporter,
        destination
      },
      {
        packagingData: {
          ficheInterventions: { connect: { id: ficheIntervention3.id } }
        }
      }
    );
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
    expect(elasticBsff.companyNames).toContain(detenteur3.company.name);
  });

  test("companyOrgIds > should contain the orgIds of ALL BSFF companies", async () => {
    // Then
    expect(elasticBsff.companyOrgIds).toContain(emitter.company.siret);
    expect(elasticBsff.companyOrgIds).toContain(transporter.company.vatNumber);
    expect(elasticBsff.companyOrgIds).toContain(destination.company.siret);
    expect(elasticBsff.companyOrgIds).toContain(detenteur1.company.siret);
    expect(elasticBsff.companyOrgIds).toContain(detenteur2.company.siret);
    expect(elasticBsff.companyOrgIds).toContain(detenteur3.company.siret);
  });
});
