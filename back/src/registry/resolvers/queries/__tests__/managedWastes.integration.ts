import {
  Form,
  Bsda,
  BsdaStatus,
  Company,
  Status,
  User,
  UserRole,
  GovernmentPermission
} from "@prisma/client";
import {
  refreshElasticSearch,
  resetDatabase
} from "../../../../../integration-tests/helper";
import { getBsdaForElastic, indexBsda } from "../../../../bsda/elastic";
import { bsdaFactory } from "../../../../bsda/__tests__/factories";
import { getFormForElastic, indexForm } from "../../../../forms/elastic";
import { Query } from "../../../../generated/graphql/types";
import {
  formFactory,
  siretify,
  userWithAccessTokenFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { MANAGED_WASTES } from "./queries";
import supertest from "supertest";
import { faker } from "@faker-js/faker";
import { app } from "../../../../server";

describe("Managed wastes registry", () => {
  let emitter: { user: User; company: Company };
  let transporter: { user: User; company: Company };
  let destination: { user: User; company: Company };
  let trader: { user: User; company: Company };
  let broker: { user: User; company: Company };
  let bsd1: Form;
  let bsd2: Bsda;

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

    destination = await userWithCompanyFactory(UserRole.ADMIN, {
      companyTypes: {
        set: ["WASTEPROCESSOR"]
      }
    });

    trader = await userWithCompanyFactory(UserRole.ADMIN, {
      companyTypes: {
        set: ["TRADER"]
      }
    });

    broker = await userWithCompanyFactory(UserRole.ADMIN, {
      companyTypes: {
        set: ["BROKER"]
      }
    });

    bsd1 = await formFactory({
      ownerId: emitter.user.id,
      opt: {
        emitterCompanySiret: emitter.company.siret,
        recipientCompanySiret: destination.company.siret,
        traderCompanySiret: trader.company.siret,
        brokerCompanySiret: broker.company.siret,
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
            number: 1
          }
        }
      }
    });
    bsd2 = await bsdaFactory({
      opt: {
        emitterCompanySiret: emitter.company.siret,
        transporterCompanySiret: transporter.company.siret,
        destinationCompanySiret: destination.company.siret,
        brokerCompanySiret: broker.company.siret,
        wasteCode: "08 01 17*",
        status: BsdaStatus.PROCESSED,
        createdAt: new Date("2021-05-01"),
        destinationReceptionWeight: 500,
        emitterEmissionSignatureDate: new Date("2021-05-01"),
        transporterTransportSignatureDate: new Date("2021-05-01"),
        transporterTransportTakenOverAt: new Date("2021-05-01"),
        destinationReceptionDate: new Date("2021-05-01"),
        destinationOperationDate: new Date("2021-05-01"),
        destinationOperationCode: "D 5"
      }
    });

    await Promise.all([
      indexForm(await getFormForElastic(bsd1)),
      indexBsda(await getBsdaForElastic(bsd2))
    ]);
    await refreshElasticSearch();
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  afterAll(resetDatabase);

  it("should return an error if the user is not authenticated", async () => {
    const { query } = makeClient();
    const { errors } = await query<Pick<Query, "managedWastes">>(
      MANAGED_WASTES,
      {
        variables: {
          sirets: [trader.company.siret]
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
    const { query } = makeClient(trader.user);
    const { errors } = await query<Pick<Query, "managedWastes">>(
      MANAGED_WASTES,
      {
        variables: {
          sirets: [broker.company.siret]
        }
      }
    );
    expect(errors).toHaveLength(1);
    expect(errors[0]).toEqual(
      expect.objectContaining({
        message: `Vous n'êtes pas autorisé à accéder au registre de l'établissement portant le n°SIRET ${broker.company.siret}`
      })
    );
  });

  it("should paginate forward with first and after", async () => {
    const { query } = makeClient(broker.user);
    const { data: page1 } = await query<Pick<Query, "managedWastes">>(
      MANAGED_WASTES,
      {
        variables: { sirets: [broker.company.siret], first: 1 }
      }
    );
    let ids = page1.managedWastes.edges.map(edge => edge.node.id);
    expect(ids).toEqual([bsd1.readableId]);
    expect(page1.managedWastes.totalCount).toEqual(2);
    expect(page1.managedWastes.pageInfo.endCursor).toEqual(bsd1.id);
    expect(page1.managedWastes.pageInfo.hasNextPage).toEqual(true);

    const { data: page2 } = await query<Pick<Query, "managedWastes">>(
      MANAGED_WASTES,
      {
        variables: {
          sirets: [broker.company.siret],
          first: 1,
          after: page1.managedWastes.pageInfo.endCursor
        }
      }
    );

    ids = page2.managedWastes.edges.map(edge => edge.node.id);
    expect(ids).toEqual([bsd2.id]);
    expect(page2.managedWastes.totalCount).toEqual(2);
    expect(page2.managedWastes.pageInfo.endCursor).toEqual(bsd2.id);
    expect(page2.managedWastes.pageInfo.hasNextPage).toEqual(false);
  });

  it("should paginate backward with last and before", async () => {
    const { query } = makeClient(broker.user);
    const { data: page1 } = await query<Pick<Query, "managedWastes">>(
      MANAGED_WASTES,
      {
        variables: { sirets: [broker.company.siret], last: 1 }
      }
    );
    let ids = page1.managedWastes.edges.map(edge => edge.node.id);
    expect(ids).toEqual([bsd2.id]);
    expect(page1.managedWastes.totalCount).toEqual(2);
    expect(page1.managedWastes.pageInfo.startCursor).toEqual(bsd2.id);
    expect(page1.managedWastes.pageInfo.hasPreviousPage).toEqual(true);

    const { data: page2 } = await query<Pick<Query, "managedWastes">>(
      MANAGED_WASTES,
      {
        variables: {
          sirets: [broker.company.siret],
          last: 1,
          before: page1.managedWastes.pageInfo.startCursor
        }
      }
    );
    ids = page2.managedWastes.edges.map(edge => edge.node.id);
    expect(ids).toEqual([bsd1.readableId]);
    expect(page2.managedWastes.totalCount).toEqual(2);
    expect(page2.managedWastes.pageInfo.startCursor).toEqual(bsd1.id);
    expect(page2.managedWastes.pageInfo.hasPreviousPage).toEqual(false);
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
        query: `{ managedWastes(sirets: ["${broker.company.siret}"]) { totalCount } }`
      })
      .set("Authorization", `Bearer ${accessToken}`)
      .set("X-Forwarded-For", allowedIP);

    expect(res.body).toEqual({ data: { managedWastes: { totalCount: 2 } } });
  });

  it("should allow user to request any siret if authenticated from a service account and orgId is in the white list", async () => {
    const request = supertest(app);

    const allowedIP = faker.internet.ipv4();

    const { accessToken } = await userWithAccessTokenFactory({
      governmentAccount: {
        create: {
          name: "RDNTS",
          permissions: [GovernmentPermission.REGISTRY_CAN_READ_ALL],
          authorizedOrgIds: [broker.company!.siret!],
          authorizedIPs: [allowedIP]
        }
      }
    });

    const res = await request
      .post("/")
      .send({
        query: `{ managedWastes(sirets: ["${broker.company.siret}"]) { totalCount } }`
      })
      .set("Authorization", `Bearer ${accessToken}`)
      .set("X-Forwarded-For", allowedIP);

    expect(res.body).toEqual({ data: { managedWastes: { totalCount: 2 } } });
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
        query: `{ managedWastes(sirets: ["${trader.company.siret}"]) { totalCount } }`
      })
      .set("Authorization", `Bearer ${accessToken}`)
      .set("X-Forwarded-For", forbiddenIP);

    expect(res.body).toEqual({
      data: null,
      errors: [
        expect.objectContaining({
          message: `Vous n'êtes pas autorisé à accéder au registre de l'établissement portant le n°SIRET ${trader.company.siret}`
        })
      ]
    });
  });

  it("should not accept service account connection from allowed IP address if the orgId does not match", async () => {
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
        query: `{ managedWastes(sirets: ["${trader.company.siret}"]) { totalCount } }`
      })
      .set("Authorization", `Bearer ${accessToken}`)
      .set("X-Forwarded-For", allowedIP);

    expect(res.body).toEqual({
      data: null,
      errors: [
        expect.objectContaining({
          message: `Vous n'êtes pas autorisé à accéder au registre de l'établissement portant le n°SIRET ${trader.company.siret}`
        })
      ]
    });
  });
});
