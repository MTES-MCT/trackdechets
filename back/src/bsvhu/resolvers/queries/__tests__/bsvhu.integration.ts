import { resetDatabase } from "../../../../../integration-tests/helper";
import { Query } from "../../../../generated/graphql/types";
import {
  companyFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import {
  bsvhuFactory,
  toIntermediaryCompany
} from "../../../__tests__/factories.vhu";

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
    ecoOrganisme {
      name
      siret
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
`;

describe("Query.Bsvhu", () => {
  afterEach(resetDatabase);

  it("should get a bsvhu by id", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const form = await bsvhuFactory({
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

  it("should get a bsvhu by id if current user is an intermediary", async () => {
    const otherCompany = await companyFactory();
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const bsvhu = await bsvhuFactory({
      opt: {
        emitterCompanySiret: otherCompany.siret,
        intermediaries: {
          create: [toIntermediaryCompany(company)]
        }
      }
    });

    const { query } = makeClient(user);

    const { data } = await query<Pick<Query, "bsvhu">>(GET_BSVHU, {
      variables: { id: bsvhu.id }
    });

    expect(data.bsvhu.id).toBe(bsvhu.id);
  });
});
