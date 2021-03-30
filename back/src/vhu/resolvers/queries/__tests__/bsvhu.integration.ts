import { resetDatabase } from "../../../../../integration-tests/helper";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { vhuFormFactory } from "../../../__tests__/factories.vhu";

const GET_BSVHU = `
query GetBsvhu($id: ID!) {
  bsvhu(id: $id) {
    id
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

    const { data } = await query(GET_BSVHU, {
      variables: { id: form.id }
    });

    expect(data.bsvhu.id).toBe(form.id);
  });
});
