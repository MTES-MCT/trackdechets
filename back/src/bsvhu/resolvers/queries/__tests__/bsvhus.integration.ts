import { resetDatabase } from "../../../../../integration-tests/helper";
import { Query } from "../../../../generated/graphql/types";
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
import { UserRole } from "@prisma/client";

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
          id
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
});
