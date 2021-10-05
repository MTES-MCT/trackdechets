import { resetDatabase } from "../../../../../integration-tests/helper";
import { Query } from "../../../../generated/graphql/types";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { vhuFormFactory } from "../../../__tests__/factories.vhu";

const GET_BSVHU = `
query GetBsvhu($id: ID!) {
  bsvhu(id: $id) {
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
`;

describe("Query.Bsvhu", () => {
  afterEach(resetDatabase);

  it("should get a bsvhu by id", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const form = await vhuFormFactory({
      opt: {
        emitterCompanySiret: company.siret
      }
    });

    const { query } = makeClient(user);

    const { data } = await query<Pick<Query, "bsvhu">>(GET_BSVHU, {
      variables: { id: form.id }
    });

    expect(data.bsvhu.id).toBe(form.id);
  });
});
