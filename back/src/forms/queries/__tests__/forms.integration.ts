import { createTestClient } from "apollo-server-integration-testing";
import { resetDatabase } from "../../../../integration-tests/helper";
import { prisma } from "../../../generated/prisma-client";
import { server } from "../../../server";
import {
  companyFactory,
  formFactory,
  userWithCompanyFactory
} from "../../../__tests__/factories";

function createForms(userId: string, params: any[]) {
  return Promise.all(
    params.map(p =>
      formFactory({
        ownerId: userId,
        opt: p
      })
    )
  );
}

describe("Integration / Forms query", () => {
  let user;
  let company;
  let query;

  beforeAll(async () => {
    const userAndCompany = await userWithCompanyFactory("ADMIN");
    user = userAndCompany.user;
    company = userAndCompany.company;
  });

  beforeEach(() => {
    const { query: q, setOptions } = createTestClient({
      apolloServer: server
    });

    setOptions({
      request: {
        user
      }
    });

    query = q;
  });

  afterAll(() => resetDatabase());

  it("should return forms for which user is emitter or receiver", async () => {
    // 4 forms
    // - 2 as recipient
    // - 1 as emitter
    // - 1 where user is owner but nothing else
    await createForms(user.id, [
      {
        recipientCompanyName: company.name,
        recipientCompanySiret: company.siret
      },
      {
        recipientCompanyName: company.name,
        recipientCompanySiret: company.siret
      },
      {
        emitterCompanyName: company.name,
        emitterCompanySiret: company.siret
      },
      {
        recipientCompanyName: "a name",
        recipientCompanySiret: "a siret"
      }
    ]);

    const { data } = await query(
      `
        query {
          forms {
            id
            recipient {
              company { siret }
            }
            emitter {
              company { siret }
            }
          }
        }
      `
    );

    expect(data.forms.length).toBe(3);

    expect(
      data.forms.filter(f => f.recipient.company.siret === company.siret).length
    ).toBe(2);
    expect(
      data.forms.filter(f => f.emitter.company.siret === company.siret).length
    ).toBe(1);
  });

  it("should return forms for which user is eco organisme", async () => {
    const eo = await prisma.createEcoOrganisme({
      address: "address",
      name: "an EO",
      siret: "eo siret"
    });

    // Create form associated to the EO
    await formFactory({
      ownerId: user.id,
      opt: {
        ecoOrganisme: { id: eo.id }
      }
    });

    const { data } = await query(
      `
        query {
          forms {
            id
          }
        }
      `
    );

    const eoForms = data.forms.filter(
      f => f.ecoOrganisme.siret === company.siret
    );
    expect(eoForms.length).toBe(1);
  });

  it("should filter by siret", async () => {
    const otherCompany = await companyFactory();
    await prisma.createCompanyAssociation({
      company: { connect: { id: otherCompany.id } },
      user: { connect: { id: user.id } },
      role: "ADMIN"
    });

    // 1 form on each company
    await createForms(user.id, [
      {
        recipientCompanyName: company.name,
        recipientCompanySiret: company.siret
      },
      {
        recipientCompanyName: otherCompany.name,
        recipientCompanySiret: otherCompany.siret
      }
    ]);

    const { data } = await query(
      `query {
          forms(siret: "${otherCompany.siret}") {
            id
            recipient {
              company { siret }
            }
          }
        }
      `
    );

    expect(data.forms.length).toBe(1);
    expect(data.forms[0].recipient.company.siret).toBe(otherCompany.siret);
  });
});
