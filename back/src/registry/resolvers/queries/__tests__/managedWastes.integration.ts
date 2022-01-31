import {
  Form,
  Bsda,
  BsdaStatus,
  Company,
  Status,
  User,
  UserRole
} from "@prisma/client";
import {
  refreshElasticSearch,
  resetDatabase
} from "../../../../../integration-tests/helper";
import { indexBsda } from "../../../../bsda/elastic";
import { bsdaFactory } from "../../../../bsda/__tests__/factories";
import { getFullForm } from "../../../../forms/database";
import { indexForm } from "../../../../forms/elastic";
import { Query } from "../../../../generated/graphql/types";
import {
  formFactory,
  userFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { MANAGED_WASTES } from "./queries";

describe("Managed wastes registry", () => {
  let emitter: { user: User; company: Company };
  let transporter: { user: User; company: Company };
  let destination: { user: User; company: Company };
  let trader: { user: User; company: Company };
  let broker: { user: User; company: Company };
  let bsd1: Form;
  let bsd2: Bsda;

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
        transporterCompanySiret: transporter.company.siret,
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
        processingOperationDone: "R 1"
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

    await Promise.all([indexForm(await getFullForm(bsd1)), indexBsda(bsd2)]);
    await refreshElasticSearch();
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
        message: `Vous n'êtes pas membre de l'entreprise portant le siret "${broker.company.siret}".`
      })
    );
  });

  it("should allow user to request any siret if authenticated from a service account", async () => {
    const user = await userFactory({ isRegistreNational: true });
    const { query } = makeClient(user);
    const { data } = await query<Pick<Query, "managedWastes">>(MANAGED_WASTES, {
      variables: {
        sirets: [broker.company.siret],
        first: 2
      }
    });
    expect(data.managedWastes.edges).toHaveLength(2);
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
});
