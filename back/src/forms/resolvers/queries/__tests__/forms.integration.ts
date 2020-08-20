import { createTestClient } from "apollo-server-integration-testing";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { prisma } from "../../../../generated/prisma-client";
import { server } from "../../../../server";
import {
  companyFactory,
  formFactory,
  userWithCompanyFactory,
  transportSegmentFactory,
  userFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";

function createForms(userId: string, params: any[]) {
  return Promise.all(
    params.map(p => {
      return formFactory({
        ownerId: userId,
        opt: p
      });
    })
  );
}

describe("Integration / Forms query", () => {
  let user;
  let company;
  let query;
  let ecoOrganisme;

  beforeEach(async () => {
    const userAndCompany = await userWithCompanyFactory("ADMIN");
    user = userAndCompany.user;
    company = userAndCompany.company;

    ecoOrganisme = await prisma.createEcoOrganisme({
      address: "address",
      name: "an EO",
      siret: company.siret
    });
  });

  beforeEach(async () => {
    await prisma.deleteManyForms();

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

  afterEach(() => resetDatabase());

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
    // Create form associated to the EO
    await formFactory({
      ownerId: user.id,
      opt: {
        ecoOrganisme: {
          connect: { id: ecoOrganisme.id }
        }
      }
    });

    const { data } = await query(
      `
        query {
          forms {
            id
            ecoOrganisme { siret }
          }
        }
      `
    );

    const eoForms = data.forms.filter(
      f => f.ecoOrganisme?.siret === company.siret
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

  it("should convert packagings to an empty array if null", async () => {
    await createForms(user.id, [
      {
        recipientCompanySiret: company.siret,
        wasteDetailsPackagings: ["CITERNE"]
      },
      {
        recipientCompanySiret: company.siret,
        wasteDetailsPackagings: []
      },
      {
        recipientCompanySiret: company.siret,
        wasteDetailsPackagings: null
      }
    ]);

    const { data, errors } = await query(
      `query {
          forms {
            wasteDetails {
              packagings
            }
            stateSummary {
              packagings
            }
          }
        }
      `
    );

    expect(errors).toBeUndefined();
    expect(data.forms.length).toBe(3);

    expect(data.forms).toEqual([
      { wasteDetails: { packagings: [] }, stateSummary: { packagings: [] } },
      { wasteDetails: { packagings: [] }, stateSummary: { packagings: [] } },
      {
        wasteDetails: { packagings: ["CITERNE"] },
        stateSummary: { packagings: ["CITERNE"] }
      }
    ]);
  });

  it("should display my forms if I am a trader", async () => {
    await createForms(user.id, [
      {
        traderCompanyName: company.name,
        traderCompanySiret: company.siret
      },
      {
        traderCompanyName: company.name,
        traderCompanySiret: company.siret
      }
    ]);

    const { data } = await query(
      `query {
          forms {
            id
          }
        }
      `
    );
    expect(data.forms.length).toBe(2);
  });

  it("should display forms according to the filters I passed in", async () => {
    // The user has many forms, and a different role in each
    await createForms(user.id, [
      {
        recipientCompanyName: company.name,
        recipientCompanySiret: company.siret,
        status: "SENT"
      },
      {
        recipientCompanyName: company.name,
        recipientCompanySiret: company.siret,
        status: "DRAFT"
      },
      {
        emitterCompanyName: company.name,
        emitterCompanySiret: company.siret,
        status: "PROCESSED"
      },
      {
        traderCompanyName: company.name,
        traderCompanySiret: company.siret,
        status: "SEALED"
      },
      {
        ecoOrganisme: {
          connect: { id: ecoOrganisme.id }
        },
        status: "RESENT"
      }
    ]);

    const { data: allForms } = await query(
      `query {
          forms {
            id
          }
        }
      `
    );
    expect(allForms.forms.length).toBe(5);

    const { data: statusFiltered } = await query(
      `query {
          forms(status: [DRAFT, SENT]) {
            id
          }
        }
      `
    );
    expect(statusFiltered.forms.length).toBe(2);

    const { data: roleFiltered } = await query(
      `query {
          forms(roles: [TRADER]) {
            id
          }
        }
      `
    );

    expect(roleFiltered.forms.length).toBe(1);

    const { data: roleAndStatusFiltered } = await query(
      `query {
          forms(roles: [EMITTER, RECIPIENT], status: [PROCESSED]) {
            id
          }
        }
      `
    );
    expect(roleAndStatusFiltered.forms.length).toBe(1);
  });

  it("should display paginated results", async () => {
    // The user has many forms, and a different role in each
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
        recipientCompanyName: company.name,
        recipientCompanySiret: company.siret
      },
      {
        recipientCompanyName: company.name,
        recipientCompanySiret: company.siret
      },
      {
        recipientCompanyName: company.name,
        recipientCompanySiret: company.siret
      },
      {
        recipientCompanyName: company.name,
        recipientCompanySiret: company.siret
      }
    ]);

    const { data: firstForms } = await query(
      `query {
          forms(first: 4) {
            id
          }
        }
      `
    );
    expect(firstForms.forms.length).toBe(4);

    const { data: skippedForms } = await query(
      `query {
          forms(first: 4, skip: 4) {
            id
          }
        }
      `
    );
    expect(skippedForms.forms.length).toBe(2);
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

describe("Integration / Forms query for transporters", () => {
  afterEach(() => resetDatabase());

  it("should return forms transported by initial transporter", async () => {
    const owner = await userFactory();

    const { user: transporter, company } = await userWithCompanyFactory(
      "ADMIN",
      { companyTypes: { set: ["TRANSPORTER"] } }
    );

    const transporterSiret = company.siret;
    // create a form transported by our transporter
    const form = await formFactory({
      ownerId: owner.id,
      opt: {
        transporterCompanySiret: transporterSiret,
        status: "SEALED"
      }
    });

    // the transporter makes the query

    const { query } = makeClient(transporter);
    const { data } = await query(
      `query {
          forms(siret: "${transporterSiret}", roles: [TRANSPORTER]) {
            id

          }
        }
      `
    );

    expect(data.forms.length).toBe(1);
    expect(data.forms[0].id).toBe(form.id);
  });

  it("should return forms transported by a segment transporter", async () => {
    const owner = await userFactory();
    const { user: transporter, company } = await userWithCompanyFactory(
      "ADMIN",
      { companyTypes: { set: ["TRANSPORTER"] } }
    );

    const transporterSiret = company.siret;
    // create a form whose first tranporter is another one
    const form = await formFactory({
      ownerId: owner.id,
      opt: {
        transporterCompanySiret: "6543",
        status: "SEALED"
      }
    });
    // our transporter is on one segment
    await transportSegmentFactory({
      formId: form.id,
      segmentPayload: { transporterCompanySiret: company.siret }
    });

    // the transporter makes the query

    const { query } = makeClient(transporter);
    const { data } = await query(
      `query {
          forms(siret: "${transporterSiret}", roles: [TRANSPORTER]) {
            id
             }
           }
         `
    );

    expect(data.forms.length).toBe(1);
    expect(data.forms[0].id).toBe(form.id);
  });
});
