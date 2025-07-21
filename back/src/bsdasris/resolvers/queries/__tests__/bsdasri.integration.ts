import { resetDatabase } from "../../../../../integration-tests/helper";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { ErrorCode } from "../../../../common/errors";
import {
  bsdasriFactory,
  initialData,
  readyToReceiveData,
  readyToProcessData,
  readyToPublishData,
  traderData,
  brokerData,
  intermediaryData
} from "../../../__tests__/factories";
import type { Query } from "@td/codegen-back";
import { fullGroupingBsdasriFragment } from "../../../fragments";
import { gql } from "graphql-tag";
import { BsdasriType } from "@prisma/client";

const GET_BSDASRI = gql`
  ${fullGroupingBsdasriFragment}
  query GetBsdasri($id: ID!) {
    bsdasri(id: $id) {
      ...FullGroupingBsdasriFragment
    }
  }
`;

describe("Query.Bsdasri", () => {
  afterEach(resetDatabase);

  it("should disallow unauthenticated user", async () => {
    const { query } = makeClient();
    const { company } = await userWithCompanyFactory("MEMBER");
    const { company: destination } = await userWithCompanyFactory("MEMBER");
    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(company),
        ...readyToPublishData(destination)
      }
    });

    const { errors } = await query<Pick<Query, "bsdasri">>(GET_BSDASRI, {
      variables: { id: dasri.id }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message: "Vous n'êtes pas connecté.",
        extensions: expect.objectContaining({
          code: ErrorCode.UNAUTHENTICATED
        })
      })
    ]);
  });

  it("should forbid access to user not on the bsd", async () => {
    const { company } = await userWithCompanyFactory("MEMBER");
    const { company: destination } = await userWithCompanyFactory("MEMBER");
    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(company),
        ...readyToPublishData(destination)
      }
    });
    const { user: otherUser } = await userWithCompanyFactory("MEMBER");

    const { query } = makeClient(otherUser);
    const { errors } = await query<Pick<Query, "bsdasri">>(GET_BSDASRI, {
      variables: { id: dasri.id }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message: "Vous n'êtes pas autorisé à accéder à ce bordereau",
        extensions: expect.objectContaining({
          code: ErrorCode.FORBIDDEN
        })
      })
    ]);
  });

  it("should allow access to admin user not on the bsd", async () => {
    const { company } = await userWithCompanyFactory("MEMBER");
    const { company: destination } = await userWithCompanyFactory("MEMBER");
    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(company),
        ...readyToPublishData(destination)
      }
    });
    const { user: otherUser } = await userWithCompanyFactory(
      "MEMBER",
      {},
      { isAdmin: true }
    );

    const { query } = makeClient(otherUser);
    const { data } = await query<Pick<Query, "bsdasri">>(GET_BSDASRI, {
      variables: { id: dasri.id }
    });
    expect(data.bsdasri.id).toBe(dasri.id);
  });

  it("should get a dasri by id", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const { company: destination } = await userWithCompanyFactory("MEMBER");
    const { company: broker } = await userWithCompanyFactory("MEMBER");
    const { company: trader } = await userWithCompanyFactory("MEMBER");
    const { company: intermediaryCompany } = await userWithCompanyFactory(
      "MEMBER"
    );
    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(company),
        ...readyToPublishData(destination),
        ...traderData(trader),
        ...brokerData(broker),
        intermediaries: {
          create: [intermediaryData(intermediaryCompany)]
        }
      }
    });

    const { query } = makeClient(user);

    const { data } = await query<Pick<Query, "bsdasri">>(GET_BSDASRI, {
      variables: { id: dasri.id }
    });

    const expected = {
      id: dasri.id,
      isDraft: false,
      status: "INITIAL",
      type: "SIMPLE",
      createdAt: dasri.createdAt.toISOString(),
      updatedAt: dasri.updatedAt.toISOString(),
      identification: {
        numbers: []
      },
      ecoOrganisme: null,
      waste: {
        code: "18 01 03*",
        adr: "abc"
      },
      emitter: {
        company: {
          name: "company_1",
          orgId: dasri.emitterCompanySiret,
          siret: dasri.emitterCompanySiret,
          vatNumber: null,
          address: "Rue jean Jaurès 92200 Neuilly",
          contact: "Contact",
          country: "FR",
          phone: "0123456789",
          mail: "emitter@test.fr"
        },
        pickupSite: null,
        emission: {
          packagings: [
            {
              type: "BOITE_CARTON",
              other: null,
              quantity: 3,
              volume: 22
            }
          ],
          weight: {
            value: 22,
            isEstimate: true
          },
          signature: null
        }
      },
      transporter: {
        company: null,
        recepisse: null,
        transport: {
          handedOverAt: null,
          takenOverAt: null,
          volume: null,
          weight: null,
          packagings: [],
          acceptation: null,
          signature: null,
          mode: "ROAD",
          plates: []
        }
      },
      destination: {
        cap: null,
        company: {
          name: dasri.destinationCompanyName,
          orgId: dasri.destinationCompanySiret,
          siret: dasri.destinationCompanySiret,
          vatNumber: null,
          address: "rue Legrand",
          contact: " Contact",
          country: "FR",
          phone: "1234567",
          mail: "recipient@test.fr"
        },
        reception: {
          date: null,
          volume: null,
          packagings: [],
          acceptation: null,
          signature: null
        },
        operation: null
      },
      broker: {
        company: {
          name: dasri.brokerCompanyName,
          orgId: dasri.brokerCompanySiret,
          siret: dasri.brokerCompanySiret,
          vatNumber: null,
          address: broker.address,
          contact: broker.contact,
          country: "FR",
          phone: broker.contactPhone,
          mail: broker.contactEmail
        },
        recepisse: {
          department: dasri.brokerRecepisseDepartment,
          number: dasri.brokerRecepisseNumber,
          validityLimit: dasri?.brokerRecepisseValidityLimit?.toISOString()
        }
      },
      trader: {
        company: {
          name: dasri.traderCompanyName,
          orgId: dasri.traderCompanySiret,
          siret: dasri.traderCompanySiret,
          vatNumber: null,
          address: trader.address,
          contact: trader.contact,
          country: "FR",
          phone: trader.contactPhone,
          mail: trader.contactEmail
        },
        recepisse: {
          department: dasri.traderRecepisseDepartment,
          number: dasri.traderRecepisseNumber,
          validityLimit: dasri?.traderRecepisseValidityLimit?.toISOString()
        }
      },
      intermediaries: [
        {
          name: intermediaryCompany.name,
          orgId: intermediaryCompany.siret,
          siret: intermediaryCompany.siret,
          vatNumber: null,
          address: intermediaryCompany.address,
          contact: "intermediary",
          country: "FR",
          phone: null,
          mail: null
        }
      ],
      grouping: [],
      groupedIn: null,
      synthesizing: [],
      synthesizedIn: null
    };

    expect(data.bsdasri).toEqual(expected);
  });

  it("should allow access to broker", async () => {
    const { company } = await userWithCompanyFactory("MEMBER");
    const { company: destination } = await userWithCompanyFactory("MEMBER");
    const { user, company: broker } = await userWithCompanyFactory("MEMBER");

    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(company),
        ...readyToPublishData(destination),

        ...brokerData(broker)
      }
    });

    const { query } = makeClient(user);

    const { data } = await query<Pick<Query, "bsdasri">>(GET_BSDASRI, {
      variables: { id: dasri.id }
    });

    expect(data.bsdasri.id).toBe(dasri.id);
  });

  it("should allow access to trader", async () => {
    const { company } = await userWithCompanyFactory("MEMBER");
    const { company: destination } = await userWithCompanyFactory("MEMBER");
    const { user, company: trader } = await userWithCompanyFactory("MEMBER");

    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(company),
        ...readyToPublishData(destination),

        ...traderData(trader)
      }
    });

    const { query } = makeClient(user);

    const { data } = await query<Pick<Query, "bsdasri">>(GET_BSDASRI, {
      variables: { id: dasri.id }
    });

    expect(data.bsdasri.id).toBe(dasri.id);
  });

  it("should allow access to intermediary", async () => {
    const { company } = await userWithCompanyFactory("MEMBER");
    const { company: destination } = await userWithCompanyFactory("MEMBER");
    const { user, company: intermediaryCompany } = await userWithCompanyFactory(
      "MEMBER"
    );

    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(company),
        ...readyToPublishData(destination),

        intermediaries: {
          create: [intermediaryData(intermediaryCompany)]
        }
      }
    });

    const { query } = makeClient(user);

    const { data } = await query<Pick<Query, "bsdasri">>(GET_BSDASRI, {
      variables: { id: dasri.id }
    });

    expect(data.bsdasri.id).toBe(dasri.id);
  });

  it("should retrieve grouped dasris", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const { company: destination } = await userWithCompanyFactory("MEMBER");
    const transporterTakenOverAt = new Date();
    const toRegroup = await bsdasriFactory({
      opt: {
        ...initialData(company),
        ...readyToPublishData(destination),
        ...readyToReceiveData(),
        ...readyToProcessData,
        status: "PROCESSED",
        transporterTakenOverAt
      }
    });

    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(company),
        ...readyToPublishData(destination),
        type: BsdasriType.GROUPING,
        grouping: { connect: [{ id: toRegroup.id }] }
      }
    });

    const { query } = makeClient(user);

    const { data } = await query<Pick<Query, "bsdasri">>(GET_BSDASRI, {
      variables: { id: dasri.id }
    });

    expect(data.bsdasri.id).toBe(dasri.id);
    const expectedRegroupedInfo = [
      {
        id: toRegroup.id,
        quantity: 3,
        volume: 66,
        postalCode: "92200",
        weight: 70,
        takenOverAt: transporterTakenOverAt.toISOString()
      }
    ];

    expect(data.bsdasri.grouping).toStrictEqual(expectedRegroupedInfo);
  });
});
