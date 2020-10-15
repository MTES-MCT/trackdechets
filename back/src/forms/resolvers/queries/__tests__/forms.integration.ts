import { addDays, format, subDays } from "date-fns";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { prisma } from "../../../../generated/prisma-client";
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

const FORMS = `
  query Forms($siret: String, $status: [FormStatus!], $roles: [FormRole!], $first: Int, $skip: Int) {
    forms(siret: $siret, status: $status, roles: $roles, first: $first, skip: $skip) {
      id
      recipient {
        company {
          siret
        }
      }
      emitter {
        company {
          siret
        }
      }
      ecoOrganisme {
        siret
      }
      wasteDetails {
        packagings
      }
      stateSummary {
        packagings
      }
    }
  }
`;

describe("Query.forms", () => {
  afterEach(() => resetDatabase());

  it("should return forms for which user is emitter or receiver", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");

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

    const { query } = makeClient(user);
    const { data } = await query(FORMS);

    expect(data.forms.length).toBe(3);
    expect(
      data.forms.filter(f => f.recipient.company.siret === company.siret).length
    ).toBe(2);
    expect(
      data.forms.filter(f => f.emitter.company.siret === company.siret).length
    ).toBe(1);
  });

  it("should return forms for which user is eco organisme", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN", {
      companyTypes: {
        set: ["ECO_ORGANISME"]
      }
    });

    // Create form associated to the EO
    await formFactory({
      ownerId: user.id,
      opt: {
        ecoOrganismeName: company.name,
        ecoOrganismeSiret: company.siret
      }
    });

    const { query } = makeClient(user);
    const { data } = await query(FORMS);

    const eoForms = data.forms.filter(
      f => f.ecoOrganisme?.siret === company.siret
    );
    expect(eoForms.length).toBe(1);
  });

  it("should filter by siret", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
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

    const { query } = makeClient(user);
    const { data } = await query(FORMS, {
      variables: {
        siret: otherCompany.siret
      }
    });

    expect(data.forms.length).toBe(1);
    expect(data.forms[0].recipient.company.siret).toBe(otherCompany.siret);
  });

  it("should convert packagings to an empty array if null", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");

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

    const { query } = makeClient(user);
    const { data, errors } = await query(FORMS);

    expect(errors).toBeUndefined();
    expect(data.forms.length).toBe(3);

    expect(data.forms).toEqual([
      expect.objectContaining({
        wasteDetails: { packagings: [] },
        stateSummary: { packagings: [] }
      }),
      expect.objectContaining({
        wasteDetails: { packagings: [] },
        stateSummary: { packagings: [] }
      }),
      expect.objectContaining({
        wasteDetails: { packagings: ["CITERNE"] },
        stateSummary: { packagings: ["CITERNE"] }
      })
    ]);
  });

  it("should display my forms if I am a trader", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");

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

    const { query } = makeClient(user);
    const { data } = await query(FORMS);

    expect(data.forms.length).toBe(2);
  });

  it("should display forms according to the filters I passed in", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN", {
      companyTypes: {
        set: ["ECO_ORGANISME"]
      }
    });

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
        ecoOrganismeName: "",
        ecoOrganismeSiret: company.siret,
        status: "RESENT"
      }
    ]);

    const { query } = makeClient(user);

    const { data: allForms } = await query(FORMS);
    expect(allForms.forms.length).toBe(5);

    const { data: statusFiltered } = await query(FORMS, {
      variables: {
        status: ["DRAFT", "SENT"]
      }
    });
    expect(statusFiltered.forms.length).toBe(2);

    const { data: roleFiltered } = await query(FORMS, {
      variables: {
        roles: ["TRADER"]
      }
    });

    expect(roleFiltered.forms.length).toBe(1);

    const { data: roleAndStatusFiltered } = await query(FORMS, {
      variables: {
        roles: ["EMITTER", "RECIPIENT"],
        status: ["PROCESSED"]
      }
    });
    expect(roleAndStatusFiltered.forms.length).toBe(1);
  });

  it("should display paginated results", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");

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

    const { query } = makeClient(user);
    // Get the forms we just created, as ordered by the API
    const { data: created } = await query(
      `query {
          forms {
            id
          }
        }
      `
    );

    const { data: firstForms } = await query(
      `query {
          forms(first: 4) {
            id
          }
        }
      `
    );
    expect(firstForms.forms.length).toBe(4);

    const { data: formsAfter } = await query(
      `query Forms($cursorAfter: ID) {
          forms(cursorAfter: $cursorAfter) {
            id
          }
        }
      `,
      { variables: { cursorAfter: created.forms[3].id } }
    );
    expect(formsAfter.forms.length).toBe(2);

    const { data: formsBefore } = await query(
      `query Forms($cursorBefore: ID) {
          forms(cursorBefore: $cursorBefore) {
            id
          }
        }
      `,
      { variables: { cursorBefore: created.forms[1].id } }
    );
    expect(formsBefore.forms.length).toBe(1);
  });

  it("should return 50 forms by default", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    await Promise.all(
      Array.from({ length: 60 }).map(() =>
        formFactory({
          ownerId: user.id,
          opt: {
            emitterCompanySiret: company.siret
          }
        })
      )
    );

    const { query } = makeClient(user);
    const { data } = await query(FORMS);
    expect(data.forms.length).toBe(50);
  });

  it("should not accepted a first argument lower than 1 or greater than 500", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    // The user has many forms, and a different role in each
    await createForms(user.id, [
      {
        recipientCompanyName: company.name,
        recipientCompanySiret: company.siret
      },
      {
        recipientCompanyName: company.name,
        recipientCompanySiret: company.siret
      }
    ]);

    const { query } = makeClient(user);
    const { errors: zeroErrors } = await query(
      `query Forms($first: Int) {
          forms(first: $first) {
            id
          }
        }
      `,
      { variables: { first: 0 } }
    );
    expect(zeroErrors.length).toBe(1);

    const { errors: negativeErrors } = await query(
      `query Forms($first: Int) {
          forms(first: $first) {
            id
          }
        }
      `,
      { variables: { first: -1 } }
    );
    expect(negativeErrors.length).toBe(1);

    const { errors: tooBigErrors } = await query(
      `query Forms($first: Int) {
          forms(first: $first) {
            id
          }
        }
      `,
      { variables: { first: 501 } }
    );
    expect(tooBigErrors.length).toBe(1);
  });

  it("should filter by siret", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
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

    const { query } = makeClient(user);
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

  it("should filter by updatedAt", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    await createForms(user.id, [
      {
        recipientCompanyName: company.name,
        recipientCompanySiret: company.siret
      },
      {
        recipientCompanyName: company.name,
        recipientCompanySiret: company.siret
      }
    ]);

    const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd");
    const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");

    const { query } = makeClient(user);
    const { data: updatedAfterYesterday } = await query(
      `query {
          forms(updatedAfter: "${yesterday}") {
            id
            recipient {
              company { siret }
            }
          }
        }
      `
    );

    expect(updatedAfterYesterday.forms.length).toBe(2);

    const { data: updatedAfterTomorrow } = await query(
      `query {
          forms(updatedAfter: "${tomorrow}") {
            id
            recipient {
              company { siret }
            }
          }
        }
      `
    );

    expect(updatedAfterTomorrow.forms.length).toBe(0);
  });

  it("should filter by waste code", async () => {
    await createForms(user.id, [
      {
        wasteDetailsCode: "01 03 04*",
        recipientCompanyName: company.name,
        recipientCompanySiret: company.siret
      },
      {
        wasteDetailsCode: "01 03 05*",
        recipientCompanyName: company.name,
        recipientCompanySiret: company.siret
      }
    ]);

    const { data } = await query(
      `query Forms($wasteCode: String) {
          forms(wasteCode: $wasteCode) {
            id
            wasteDetails {
              code
            }
          }
        }
      `,
      { variables: { wasteCode: "01 03 04*" } }
    );

    expect(data.forms.length).toBe(1);
    expect(data.forms[0].wasteDetails.code).toBe("01 03 04*");
  });

  it("should filter by siretPresentOnForm", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const otherCompany = await companyFactory();

    await createForms(user.id, [
      {
        recipientCompanyName: company.name,
        recipientCompanySiret: company.siret
      },
      {
        recipientCompanyName: company.name,
        recipientCompanySiret: company.siret,
        emitterCompanyName: otherCompany.name,
        emitterCompanySiret: otherCompany.siret
      }
    ]);

    const { query } = makeClient(user);
    const { data } = await query(
      `query {
          forms(siretPresentOnForm: "${otherCompany.siret}") {
            id
            emitter {
              company { siret }
            }
          }
        }
      `
    );

    expect(data.forms.length).toBe(1);
    expect(data.forms[0].emitter.company.siret).toBe(otherCompany.siret);
  });
});

describe("Integration / Forms query for transporters", () => {
  afterEach(() => resetDatabase());

  it("should return forms transported by initial transporter", async () => {
    const owner = await userFactory();
    const { user, company: transporter } = await userWithCompanyFactory(
      "ADMIN",
      {
        companyTypes: {
          set: ["TRANSPORTER"]
        }
      }
    );

    // create a form transported by our transporter
    const form = await formFactory({
      ownerId: owner.id,
      opt: {
        transporterCompanySiret: transporter.siret,
        status: "SEALED"
      }
    });

    // the transporter makes the query
    const { query } = makeClient(user);
    const { data } = await query(FORMS, {
      variables: {
        siret: transporter.siret,
        roles: ["TRANSPORTER"]
      }
    });

    expect(data.forms.length).toBe(1);
    expect(data.forms[0].id).toBe(form.id);
  });

  it("should return forms transported by a segment transporter", async () => {
    const owner = await userFactory();
    const { user, company: transporter } = await userWithCompanyFactory(
      "ADMIN",
      {
        companyTypes: {
          set: ["TRANSPORTER"]
        }
      }
    );

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
      segmentPayload: {
        transporterCompanySiret: transporter.siret
      }
    });

    // the transporter makes the query
    const { query } = makeClient(user);
    const { data } = await query(FORMS, {
      variables: {
        siret: transporter.siret,
        roles: ["TRANSPORTER"]
      }
    });

    expect(data.forms.length).toBe(1);
    expect(data.forms[0].id).toBe(form.id);
  });
});
