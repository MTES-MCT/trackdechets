import { resetDatabase } from "../../../../../integration-tests/helper";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { vhuFormFactory } from "../../../__tests__/factories.vhu";

const GET_BSVHUS = `
  query GetBsvhus($siret: String, $where: BsvhuWhere) {
    bsvhus(siret: $siret, where: $where) {
      totalCount
      pageInfo {
        startCursor
        endCursor
        hasNextPage
      }
      edges {
        node {id
          isDraft
          recipient {
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
            }
            tvaIntracommunautaire
            recepisse {
              number
            }
          }
          quantity {
            number
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

    const { data } = await query(GET_BSVHUS);

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

    const { data } = await query(GET_BSVHUS);

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
    await vhuFormFactory({ opt: { recipientCompanySiret: company.siret } });

    const { query } = makeClient(user);
    const { data } = await query(GET_BSVHUS, {
      variables: { where: { recipient: { company: { siret: company.siret } } } }
    });

    expect(data.bsvhus.edges.length).toBe(1);
  });
});
