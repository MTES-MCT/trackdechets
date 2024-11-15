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
import { ErrorCode } from "../../../../common/errors";

const GET_BSVHU = `
query GetBsvhu($id: ID!) {
  bsvhu(id: $id) {
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

  it("should disallow unauthenticated user", async () => {
    const { company } = await userWithCompanyFactory("MEMBER");

    const bsvhu = await bsvhuFactory({
      opt: {
        emitterCompanySiret: company.siret
      }
    });

    const { query } = makeClient();

    const { errors } = await query<Pick<Query, "bsvhu">>(GET_BSVHU, {
      variables: { id: bsvhu.id }
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

  it("should get a bsvhu by id", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const bsvhu = await bsvhuFactory({
      opt: {
        emitterCompanySiret: company.siret
      }
    });

    const { query } = makeClient(user);

    const { data } = await query<Pick<Query, "bsvhu">>(GET_BSVHU, {
      variables: { id: bsvhu.id }
    });

    expect(data.bsvhu.id).toBe(bsvhu.id);
  });

  it("should forbid access to user not on the bsd", async () => {
    const { company } = await userWithCompanyFactory("MEMBER");

    const bsvhu = await bsvhuFactory({
      opt: {
        emitterCompanySiret: company.siret
      }
    });
    const { user: otherUser } = await userWithCompanyFactory("MEMBER");

    const { query } = makeClient(otherUser);

    const { errors } = await query<Pick<Query, "bsvhu">>(GET_BSVHU, {
      variables: { id: bsvhu.id }
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

    const bsvhu = await bsvhuFactory({
      opt: {
        emitterCompanySiret: company.siret
      }
    });
    const { user: otherUser } = await userWithCompanyFactory(
      "MEMBER",
      {},
      { isAdmin: true }
    );

    const { query } = makeClient(otherUser);

    const { data } = await query<Pick<Query, "bsvhu">>(GET_BSVHU, {
      variables: { id: bsvhu.id }
    });

    expect(data.bsvhu.id).toBe(bsvhu.id);
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

  it("should retrieve queried fields", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const bsvhu = await bsvhuFactory({
      opt: {
        customId: "some custom ID",
        emitterCompanySiret: company.siret
      }
    });

    const { query } = makeClient(user);

    const { data } = await query<Pick<Query, "bsvhu">>(GET_BSVHU, {
      variables: { id: bsvhu.id }
    });

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
          siret: bsvhu.transporterCompanySiret,
          name: bsvhu.transporterCompanyName,
          address: bsvhu.transporterCompanyAddress,
          contact: bsvhu.transporterCompanyContact,
          mail: bsvhu.transporterCompanyMail,
          phone: bsvhu.transporterCompanyPhone,
          vatNumber: null
        },
        recepisse: { number: bsvhu.transporterRecepisseNumber }
      },
      ecoOrganisme: {
        name: bsvhu.ecoOrganismeName,
        siret: bsvhu.ecoOrganismeSiret
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

    expect(data.bsvhu).toEqual(expected);
  });
});
