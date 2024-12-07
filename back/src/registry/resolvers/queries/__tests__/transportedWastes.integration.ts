import {
  Form,
  Bsda,
  Bsdasri,
  BsdaStatus,
  Bsff,
  BsvhuStatus,
  Bspaoh,
  BspaohStatus,
  Company,
  Status,
  User,
  UserRole,
  BsdasriStatus,
  GovernmentPermission,
  Bsvhu
} from "@prisma/client";
import {
  refreshElasticSearch,
  resetDatabase
} from "../../../../../integration-tests/helper";
import { getBsdaForElastic, indexBsda } from "../../../../bsda/elastic";
import { bsdaFactory } from "../../../../bsda/__tests__/factories";
import {
  getBsdasriForElastic,
  indexBsdasri
} from "../../../../bsdasris/elastic";

import { bsdasriFactory } from "../../../../bsdasris/__tests__/factories";
import { getBsffForElastic, indexBsff } from "../../../../bsffs/elastic";
import { createBsffAfterOperation } from "../../../../bsffs/__tests__/factories";
import { getBsvhuForElastic, indexBsvhu } from "../../../../bsvhu/elastic";
import { bsvhuFactory } from "../../../../bsvhu/__tests__/factories.vhu";
import { getFormForElastic, indexForm } from "../../../../forms/elastic";
import { bspaohFactory } from "../../../../bspaoh/__tests__/factories";
import { getBspaohForElastic, indexBspaoh } from "../../../../bspaoh/elastic";
import { Query } from "@td/codegen-back";
import {
  formFactory,
  siretify,
  userWithAccessTokenFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { TRANSPORTED_WASTES } from "./queries";
import supertest from "supertest";
import { faker } from "@faker-js/faker";
import { app } from "../../../../server";

describe("Transported wastes registry", () => {
  let emitter: { user: User; company: Company };
  let transporter: { user: User; company: Company };
  let transporter2: { user: User; company: Company };
  let destination: { user: User; company: Company };
  let bsd1: Form;
  let bsd2: Bsda;
  let bsd3: Bsdasri;
  let bsd4: Bsvhu;
  let bsd5: Bsff;
  let bsd6: Bspaoh;

  const OLD_ENV = process.env;

  beforeAll(async () => {
    emitter = await userWithCompanyFactory(UserRole.ADMIN, {
      companyTypes: {
        set: ["PRODUCER"]
      }
    });
    transporter = await userWithCompanyFactory(UserRole.ADMIN, {
      companyTypes: {
        set: ["TRANSPORTER"]
      }
    });
    transporter2 = await userWithCompanyFactory(UserRole.ADMIN, {
      companyTypes: {
        set: ["TRANSPORTER"]
      }
    });
    destination = await userWithCompanyFactory(UserRole.ADMIN, {
      companyTypes: {
        set: ["WASTEPROCESSOR"]
      }
    });

    bsd1 = await formFactory({
      ownerId: transporter.user.id,
      opt: {
        emitterCompanySiret: emitter.company.siret,
        recipientCompanySiret: destination.company.siret,
        wasteDetailsCode: "05 01 02*",
        status: Status.PROCESSED,
        quantityReceived: 1000,
        createdAt: new Date("2021-04-01"),
        sentAt: new Date("2021-04-01"),
        receivedAt: new Date("2021-04-01"),
        processedAt: new Date("2021-04-01"),
        processingOperationDone: "R 1",
        transporters: {
          create: {
            transporterCompanySiret: transporter.company.siret,
            number: 1,
            takenOverAt: new Date()
          }
        }
      }
    });
    bsd2 = await bsdaFactory({
      opt: {
        emitterCompanySiret: emitter.company.siret,
        destinationCompanySiret: destination.company.siret,
        wasteCode: "08 01 17*",
        status: BsdaStatus.PROCESSED,
        createdAt: new Date("2021-05-01"),
        destinationReceptionWeight: 500,
        emitterEmissionSignatureDate: new Date("2021-05-01"),
        transporterTransportSignatureDate: new Date("2021-05-01"),
        destinationReceptionDate: new Date("2021-05-01"),
        destinationOperationDate: new Date("2021-05-01"),
        destinationOperationCode: "D 5"
      },
      transporterOpt: {
        transporterTransportSignatureDate: new Date("2021-05-01"),
        transporterCompanySiret: transporter.company.siret,
        transporterTransportTakenOverAt: new Date("2021-05-01")
      }
    });
    bsd3 = await bsdasriFactory({
      opt: {
        emitterCompanySiret: emitter.company.siret,
        transporterCompanySiret: transporter.company.siret,
        destinationCompanySiret: destination.company.siret,
        wasteCode: "18 01 03*",
        status: BsdasriStatus.PROCESSED,
        createdAt: new Date("2021-06-01"),
        destinationReceptionWasteWeightValue: 10,
        emitterEmissionSignatureDate: new Date("2021-06-01"),
        transporterTransportSignatureDate: new Date("2021-06-01"),
        transporterTakenOverAt: new Date("2021-06-01"),
        destinationReceptionDate: new Date("2021-06-01"),
        destinationOperationDate: new Date("2021-06-01"),
        destinationOperationCode: "R 13"
      }
    });
    bsd4 = await bsvhuFactory({
      opt: {
        emitterCompanySiret: emitter.company.siret,
        transporterCompanySiret: transporter.company.siret,
        destinationCompanySiret: destination.company.siret,
        wasteCode: "16 01 04*",
        status: BsvhuStatus.PROCESSED,
        createdAt: new Date("2021-07-01"),
        destinationReceptionWeight: 3000,
        emitterEmissionSignatureDate: new Date("2021-07-01"),
        transporterTransportSignatureDate: new Date("2021-07-01"),
        transporterTransportTakenOverAt: new Date("2021-07-01"),
        destinationReceptionDate: new Date("2021-07-01"),
        destinationOperationDate: new Date("2021-07-01"),
        destinationOperationCode: "R 8"
      }
    });
    bsd5 = await createBsffAfterOperation(
      {
        emitter,
        transporter,
        destination
      },
      {
        data: {
          wasteCode: "14 06 01*",
          createdAt: new Date("2021-08-01"),
          emitterEmissionSignatureDate: new Date("2021-08-01"),
          transporterTransportSignatureDate: new Date("2021-08-01"),
          destinationReceptionDate: new Date("2021-08-01")
        },
        packagingData: {
          acceptationWeight: 200,
          operationSignatureDate: new Date("2021-08-01"),
          operationCode: "R2"
        },
        transporterData: {
          transporterTransportTakenOverAt: new Date("2021-08-01")
        }
      }
    );

    bsd6 = await bspaohFactory({
      opt: {
        status: BspaohStatus.PROCESSED,
        emitterCompanySiret: emitter.company.siret,

        destinationCompanySiret: destination.company.siret,
        emitterEmissionSignatureDate: new Date("2021-09-01"),
        destinationReceptionDate: new Date("2021-09-01"),
        destinationReceptionSignatureDate: new Date("2021-09-01"),
        destinationOperationDate: new Date("2021-09-01"),
        destinationOperationCode: "D 10",
        transporterTransportTakenOverAt: new Date("2021-09-02"),
        transporters: {
          create: {
            number: 1,
            transporterCompanySiret: transporter.company.siret,
            transporterTransportSignatureDate: new Date("2021-09-02")
          }
        }
      }
    });
    await Promise.all([
      indexForm(await getFormForElastic(bsd1)),
      indexBsda(await getBsdaForElastic(bsd2)),
      indexBsdasri(await getBsdasriForElastic(bsd3)),
      indexBsvhu(await getBsvhuForElastic(bsd4)),
      indexBsff(await getBsffForElastic(bsd5)),
      indexBspaoh(await getBspaohForElastic(bsd6))
    ]);
    await refreshElasticSearch();
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  afterAll(resetDatabase);

  it("should return an error if the user is not authenticated", async () => {
    const { query } = makeClient();
    const { errors } = await query<Pick<Query, "transportedWastes">>(
      TRANSPORTED_WASTES,
      {
        variables: {
          sirets: [transporter.company.siret]
        }
      }
    );
    expect(errors).toHaveLength(1);
    expect(errors[0]).toEqual(
      expect.objectContaining({
        message: "Vous n'êtes pas connecté."
      })
    );
  });

  it("should return an error when querying a SIRET the user is not member of", async () => {
    const { query } = makeClient(transporter.user);
    const { errors } = await query<Pick<Query, "transportedWastes">>(
      TRANSPORTED_WASTES,
      {
        variables: {
          sirets: [transporter2.company.siret]
        }
      }
    );
    expect(errors).toHaveLength(1);
    expect(errors[0]).toEqual(
      expect.objectContaining({
        message: `Vous n'êtes pas autorisé à accéder au registre de l'établissement portant le n°SIRET ${transporter2.company.siret}`
      })
    );
  });

  it("should paginate forward with first and after", async () => {
    const { query } = makeClient(transporter.user);
    const { data: page1 } = await query<Pick<Query, "transportedWastes">>(
      TRANSPORTED_WASTES,
      {
        variables: { sirets: [transporter.company.siret], first: 2 }
      }
    );
    let ids = page1.transportedWastes.edges.map(edge => edge.node.id);
    expect(ids).toEqual([bsd1.readableId, bsd2.id]);
    expect(page1.transportedWastes.totalCount).toEqual(6);
    expect(page1.transportedWastes.pageInfo.endCursor).toEqual(bsd2.id);
    expect(page1.transportedWastes.pageInfo.hasNextPage).toEqual(true);

    const { data: page2 } = await query<Pick<Query, "transportedWastes">>(
      TRANSPORTED_WASTES,
      {
        variables: {
          sirets: [transporter.company.siret],
          first: 2,
          after: page1.transportedWastes.pageInfo.endCursor
        }
      }
    );

    ids = page2.transportedWastes.edges.map(edge => edge.node.id);
    expect(ids).toEqual([bsd3.id, bsd4.id]);
    expect(page2.transportedWastes.totalCount).toEqual(6);
    expect(page2.transportedWastes.pageInfo.endCursor).toEqual(bsd4.id);
    expect(page2.transportedWastes.pageInfo.hasNextPage).toEqual(true);

    const { data: page3 } = await query<Pick<Query, "transportedWastes">>(
      TRANSPORTED_WASTES,
      {
        variables: {
          sirets: [transporter.company.siret],
          first: 2,
          after: page2.transportedWastes.pageInfo.endCursor
        }
      }
    );
    ids = page3.transportedWastes.edges.map(edge => edge.node.id);
    expect(ids).toEqual([bsd5.id, bsd6.id]);
    expect(page3.transportedWastes.totalCount).toEqual(6);
    expect(page3.transportedWastes.pageInfo.endCursor).toEqual(bsd6.id);
    expect(page3.transportedWastes.pageInfo.hasNextPage).toEqual(false);
  });

  it("should paginate backward with last and before", async () => {
    const { query } = makeClient(transporter.user);
    const { data: page1 } = await query<Pick<Query, "transportedWastes">>(
      TRANSPORTED_WASTES,
      {
        variables: { sirets: [transporter.company.siret], last: 2 }
      }
    );
    let ids = page1.transportedWastes.edges.map(edge => edge.node.id);
    expect(ids).toEqual([bsd5.id, bsd6.id]);
    expect(page1.transportedWastes.totalCount).toEqual(6);
    expect(page1.transportedWastes.pageInfo.startCursor).toEqual(bsd5.id);
    expect(page1.transportedWastes.pageInfo.hasPreviousPage).toEqual(true);

    const { data: page2 } = await query<Pick<Query, "transportedWastes">>(
      TRANSPORTED_WASTES,
      {
        variables: {
          sirets: [transporter.company.siret],
          last: 2,
          before: page1.transportedWastes.pageInfo.startCursor
        }
      }
    );
    ids = page2.transportedWastes.edges.map(edge => edge.node.id);
    expect(ids).toEqual([bsd3.id, bsd4.id]);

    expect(page2.transportedWastes.totalCount).toEqual(6);
    expect(page2.transportedWastes.pageInfo.startCursor).toEqual(bsd3.id);
    expect(page2.transportedWastes.pageInfo.hasPreviousPage).toEqual(true);

    const { data: page3 } = await query<Pick<Query, "transportedWastes">>(
      TRANSPORTED_WASTES,
      {
        variables: {
          sirets: [transporter.company.siret],
          last: 2,
          before: page2.transportedWastes.pageInfo.startCursor
        }
      }
    );
    ids = page3.transportedWastes.edges.map(edge => edge.node.id);
    expect(ids).toEqual([bsd1.readableId, bsd2.id]);

    expect(page3.transportedWastes.totalCount).toEqual(6);
    expect(page3.transportedWastes.pageInfo.startCursor).toEqual(bsd1.id);
    expect(page3.transportedWastes.pageInfo.hasPreviousPage).toEqual(false);
  });

  it("should allow user to request any siret if authenticated from a service account", async () => {
    const request = supertest(app);

    const allowedIP = faker.internet.ipv4();

    const { accessToken } = await userWithAccessTokenFactory({
      governmentAccount: {
        create: {
          name: "RDNTS",
          permissions: [GovernmentPermission.REGISTRY_CAN_READ_ALL],
          authorizedOrgIds: ["ALL"],
          authorizedIPs: [allowedIP]
        }
      }
    });

    const res = await request
      .post("/")
      .send({
        query: `{ transportedWastes(sirets: ["${transporter.company.siret}"]) { totalCount } }`
      })
      .set("Authorization", `Bearer ${accessToken}`)
      .set("X-Forwarded-For", allowedIP);

    expect(res.body).toEqual({
      data: { transportedWastes: { totalCount: 6 } }
    });
  });

  it("should allow user to request any siret if authenticated from a service account and orgId is in the white list", async () => {
    const request = supertest(app);

    const allowedIP = faker.internet.ipv4();

    const { accessToken } = await userWithAccessTokenFactory({
      governmentAccount: {
        create: {
          name: "RDNTS",
          permissions: [GovernmentPermission.REGISTRY_CAN_READ_ALL],
          authorizedOrgIds: [transporter.company!.siret!],
          authorizedIPs: [allowedIP]
        }
      }
    });

    const res = await request
      .post("/")
      .send({
        query: `{ transportedWastes(sirets: ["${transporter.company.siret}"]) { totalCount } }`
      })
      .set("Authorization", `Bearer ${accessToken}`)
      .set("X-Forwarded-For", allowedIP);

    expect(res.body).toEqual({
      data: { transportedWastes: { totalCount: 6 } }
    });
  });

  it("should not accept service account connection from IP address not in the white list", async () => {
    const request = supertest(app);

    const allowedIP = faker.internet.ipv4();
    const forbiddenIP = faker.internet.ipv4();

    const { accessToken } = await userWithAccessTokenFactory({
      governmentAccount: {
        create: {
          name: "RDNTS",
          permissions: [GovernmentPermission.REGISTRY_CAN_READ_ALL],
          authorizedOrgIds: ["ALL"],
          authorizedIPs: [allowedIP]
        }
      }
    });

    const res = await request
      .post("/")
      .send({
        query: `{ transportedWastes(sirets: ["${transporter.company.siret}"]) { totalCount } }`
      })
      .set("Authorization", `Bearer ${accessToken}`)
      .set("X-Forwarded-For", forbiddenIP);

    expect(res.body).toEqual({
      data: null,
      errors: [
        expect.objectContaining({
          message: `Vous n'êtes pas autorisé à accéder au registre de l'établissement portant le n°SIRET ${transporter.company.siret}`
        })
      ]
    });
  });

  it("should not accept service account connection from authorized IP address if orgId does not match", async () => {
    const request = supertest(app);

    const allowedIP = faker.internet.ipv4();

    const { accessToken } = await userWithAccessTokenFactory({
      governmentAccount: {
        create: {
          name: "RDNTS",
          permissions: [GovernmentPermission.REGISTRY_CAN_READ_ALL],
          authorizedOrgIds: [siretify()],
          authorizedIPs: [allowedIP]
        }
      }
    });

    const res = await request
      .post("/")
      .send({
        query: `{ transportedWastes(sirets: ["${transporter.company.siret}"]) { totalCount } }`
      })
      .set("Authorization", `Bearer ${accessToken}`)
      .set("X-Forwarded-For", allowedIP);

    expect(res.body).toEqual({
      data: null,
      errors: [
        expect.objectContaining({
          message: `Vous n'êtes pas autorisé à accéder au registre de l'établissement portant le n°SIRET ${transporter.company.siret}`
        })
      ]
    });
  });
});
