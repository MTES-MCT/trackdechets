import { resetDatabase } from "../../../../../integration-tests/helper";
import { Query } from "../../../../generated/graphql/types";
import {
  companyAssociatedToExistingUserFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { vhuFormFactory } from "../../../__tests__/factories.vhu";

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
    await vhuFormFactory({ opt });
    await vhuFormFactory({ opt });
    await vhuFormFactory({ opt });
    await vhuFormFactory({ opt });

    const { query } = makeClient(user);

    const { data } = await query<Pick<Query, "bsvhus">>(GET_BSVHUS);

    expect(data.bsvhus.edges.length).toBe(4);
  });

  it("should return paging infos", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const opt = {
      emitterCompanySiret: company.siret
    };
    // Create 4 forms
    const firstForm = await vhuFormFactory({ opt });
    await vhuFormFactory({ opt });
    await vhuFormFactory({ opt });
    const lastForm = await vhuFormFactory({ opt });

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
    await vhuFormFactory({ opt });
    await vhuFormFactory({ opt });
    await vhuFormFactory({ opt });
    await vhuFormFactory({ opt });

    // And 1 on recipient company
    await vhuFormFactory({ opt: { destinationCompanySiret: company.siret } });

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
    await vhuFormFactory({ opt: { emitterCompanySiret: company.siret } });
    await vhuFormFactory({ opt: { emitterCompanySiret: secondCompany.siret } });
    // 1 form belonging to someone else
    await vhuFormFactory({
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

    await vhuFormFactory({
      opt: { emitterCompanySiret: outOfScopeCompany.siret }
    });

    const { query } = makeClient(user);

    const { data } = await query<Pick<Query, "bsvhus">>(GET_BSVHUS);
    expect(data.bsvhus.edges.length).toBe(0);
  });
});
