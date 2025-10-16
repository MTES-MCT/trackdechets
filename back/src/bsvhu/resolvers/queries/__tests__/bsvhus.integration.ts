import { resetDatabase } from "../../../../../integration-tests/helper";
import type { Query } from "@td/codegen-back";
import {
  companyAssociatedToExistingUserFactory,
  companyFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import {
  bsvhuFactory,
  toIntermediaryCompany
} from "../../../__tests__/factories.vhu";
import { OperationMode, UserRole } from "@prisma/client";
import { ErrorCode } from "../../../../common/errors";

const GET_BSVHUS = `
  query GetBsvhus($where: BsvhuWhere) {
    bsvhus(where: $where) {
      totalCount
      pageInfo {
        startCursor
        endCursor
        hasNextPage
      }
      edges {
        node {
          metadata {
            errors {
              message
              requiredFor
            }
          }
          id
          customId
          isDraft
          destination {
            company {
              siret
            }
          }
          emitter {
            agrementNumber
              company {
              siret
            }
          }
          transporter {
            company {
              siret
              name
              address
              contact
              mail
              phone
              vatNumber
            }
            recepisse {
              number
            }
            transport {
              mode
              plates
            }
          }
          broker {
            company {
              siret
            }
            recepisse {
              number
            }
          }
          trader {
            company {
              siret
            }
            recepisse {
              number
            }
          }
          weight {
            value
          }
        }
      }
    }
  }
  `;

describe("Query.Bsvhus", () => {
  afterEach(resetDatabase);

  it("should disallow unauthenticated user", async () => {
    const { query } = makeClient();
    const { company } = await userWithCompanyFactory("MEMBER");

    await bsvhuFactory({
      opt: { emitterCompanySiret: company.siret, customId: "some custom ID" }
    });

    const { errors } = await query<Pick<Query, "bsvhus">>(GET_BSVHUS);
    expect(errors).toEqual([
      expect.objectContaining({
        message: "Vous n'êtes pas connecté.",
        extensions: expect.objectContaining({
          code: ErrorCode.UNAUTHENTICATED
        })
      })
    ]);
  });

  it("should get a list of bsvhus when user belongs to only 1 company", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const opt = {
      emitterCompanySiret: company.siret
    };
    // Create 4 forms
    await bsvhuFactory({ opt });
    await bsvhuFactory({ opt });
    await bsvhuFactory({ opt });
    await bsvhuFactory({ opt });

    const { query } = makeClient(user);

    const { data } = await query<Pick<Query, "bsvhus">>(GET_BSVHUS);

    expect(data.bsvhus.edges.length).toBe(4);
  });

  it("should retrieve queried fields", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const bsvhu = await bsvhuFactory({
      opt: {
        emitterCompanySiret: company.siret,
        customId: "some custom ID"
      }
    });

    const { query } = makeClient(user);

    const { data } = await query<Pick<Query, "bsvhus">>(GET_BSVHUS);

    expect(data.bsvhus.edges.length).toBe(1);

    const expected = {
      id: bsvhu.id,
      customId: "some custom ID",
      isDraft: false,
      destination: { company: { siret: bsvhu.destinationCompanySiret } },
      emitter: {
        agrementNumber: bsvhu.emitterAgrementNumber,
        company: { siret: bsvhu.emitterCompanySiret }
      },
      transporter: {
        company: {
          siret: bsvhu.transporters[0].transporterCompanySiret,
          name: bsvhu.transporters[0].transporterCompanyName,
          address: bsvhu.transporters[0].transporterCompanyAddress,
          contact: bsvhu.transporters[0].transporterCompanyContact,
          mail: bsvhu.transporters[0].transporterCompanyMail,
          phone: bsvhu.transporters[0].transporterCompanyPhone,
          vatNumber: null
        },
        transport: {
          mode: bsvhu.transporters[0].transporterTransportMode,
          plates: bsvhu.transporters[0].transporterTransportPlates
        },
        recepisse: { number: bsvhu.transporters[0].transporterRecepisseNumber }
      },

      broker: {
        company: { siret: bsvhu.brokerCompanySiret },
        recepisse: { number: bsvhu.brokerRecepisseNumber }
      },
      trader: {
        company: { siret: bsvhu.traderCompanySiret },
        recepisse: { number: bsvhu.traderRecepisseNumber }
      },
      weight: { value: 0.0014 } // cf. getVhuFormdata()
    };

    expect(data.bsvhus.edges[0].node).toEqual(expected);
  });

  it("should return bsvhus where user company is an intermediary", async () => {
    const otherCompany = await companyFactory();
    const { company, user } = await userWithCompanyFactory(UserRole.ADMIN);
    await bsvhuFactory({
      opt: {
        emitterCompanySiret: otherCompany.siret,
        intermediaries: {
          create: [toIntermediaryCompany(company)]
        }
      }
    });

    const { query } = makeClient(user);
    const { data } = await query<Pick<Query, "bsvhus">>(GET_BSVHUS);

    expect(data.bsvhus.edges.length).toBe(1);
  });

  it("should return paging infos", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const opt = {
      emitterCompanySiret: company.siret
    };
    // Create 4 forms
    const firstForm = await bsvhuFactory({ opt });
    await bsvhuFactory({ opt });
    await bsvhuFactory({ opt });
    const lastForm = await bsvhuFactory({ opt });

    const { query } = makeClient(user);

    const { data } = await query<Pick<Query, "bsvhus">>(GET_BSVHUS);

    expect(data.bsvhus.totalCount).toBe(4);
    expect(data.bsvhus.pageInfo.startCursor).toBe(lastForm.id);
    expect(data.bsvhus.pageInfo.endCursor).toBe(firstForm.id);
    expect(data.bsvhus.pageInfo.hasNextPage).toBe(false);
  });

  it("should get a filtered list of bsvhus when user belongs to 1 company and passes a where condition", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const opt = {
      emitterCompanySiret: company.siret
    };
    // Create 3 forms on emitter Company
    await bsvhuFactory({ opt });
    await bsvhuFactory({ opt });
    await bsvhuFactory({ opt });
    await bsvhuFactory({ opt });

    // And 1 on recipient company
    await bsvhuFactory({ opt: { destinationCompanySiret: company.siret } });

    const { query } = makeClient(user);
    const { data } = await query<Pick<Query, "bsvhus">>(GET_BSVHUS, {
      variables: {
        where: { destination: { company: { siret: { _eq: company.siret } } } }
      }
    });

    expect(data.bsvhus.edges.length).toBe(1);
  });

  it("should get a filtered list of bsvhus when wehre condition filters by customId", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const opt = {
      emitterCompanySiret: company.siret
    };
    // Create 3 forms on emitter Company
    const bsvhu = await bsvhuFactory({
      opt: { ...opt, customId: "mycustomid" }
    });
    await bsvhuFactory({ opt });
    await bsvhuFactory({ opt });
    await bsvhuFactory({ opt });

    const { query } = makeClient(user);
    const { data } = await query<Pick<Query, "bsvhus">>(GET_BSVHUS, {
      variables: {
        where: { customId: { _eq: "mycustomid" } }
      }
    });

    expect(data.bsvhus.edges.length).toBe(1);
    expect(data.bsvhus.edges[0].node.id).toBe(bsvhu.id);
  });

  it("should get bsvhus from every companies when no filter is passed and user belongs to several companies", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const secondCompany = await companyAssociatedToExistingUserFactory(
      user,
      "MEMBER"
    );
    const { company: outOfScopeCompany } = await userWithCompanyFactory(
      "MEMBER"
    );

    // 2 forms belonging to the current user
    await bsvhuFactory({ opt: { emitterCompanySiret: company.siret } });
    await bsvhuFactory({ opt: { emitterCompanySiret: secondCompany.siret } });
    // 1 form belonging to someone else
    await bsvhuFactory({
      opt: { emitterCompanySiret: outOfScopeCompany.siret }
    });

    const { query } = makeClient(user);

    const { data } = await query<Pick<Query, "bsvhus">>(GET_BSVHUS);
    expect(data.bsvhus.edges.length).toBe(2);
  });

  it("should get an empty result when trying to access bsvhus the current user isn't associated with", async () => {
    const { user } = await userWithCompanyFactory("MEMBER");
    const { company: outOfScopeCompany } = await userWithCompanyFactory(
      "MEMBER"
    );

    await bsvhuFactory({
      opt: { emitterCompanySiret: outOfScopeCompany.siret }
    });

    const { query } = makeClient(user);

    const { data } = await query<Pick<Query, "bsvhus">>(GET_BSVHUS);
    expect(data.bsvhus.edges.length).toBe(0);
  });

  it("should get a list of bsvhus filtered by plate", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const opt = {
      emitterCompanySiret: company.siret
    };
    // Create 3 forms on emitter Company
    await bsvhuFactory({ opt });
    await bsvhuFactory({ opt });
    await bsvhuFactory({ opt });
    const vhu = await bsvhuFactory({
      opt: {
        ...opt,
        transporters: {
          create: {
            number: 1,
            transporterTransportPlates: ["XY-23-TT"]
          }
        }
      }
    });

    // And 1 on recipient company
    await bsvhuFactory({ opt: { destinationCompanySiret: company.siret } });

    const { query } = makeClient(user);
    const { data } = await query<Pick<Query, "bsvhus">>(GET_BSVHUS, {
      variables: {
        where: {
          transporter: { transport: { plates: { _has: "XY-23-TT" } } }
        }
      }
    });

    expect(data.bsvhus.edges.length).toBe(1);
    expect(data.bsvhus.edges[0].node.id).toBe(vhu.id);
  });

  it("should get a list of bsvhus even if the operation mode is illegal", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const opt = {
      emitterCompanySiret: company.siret,
      destinationOperationCode: "R 4",
      destinationOperationMode: OperationMode.REUTILISATION, // Illegal mode for R4
      destinationOperationSignatureDate: new Date()
    };
    await bsvhuFactory({ opt });

    // When
    const { query } = makeClient(user);
    const { data, errors } = await query<Pick<Query, "bsvhus">>(GET_BSVHUS);

    // Then
    console.log("edge 1", data.bsvhus.edges[0].node.metadata?.errors);
    expect(errors).toBeUndefined();
    expect(data.bsvhus.edges.length).toBe(1);
  });
});
