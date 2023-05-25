import { addDays, format, subDays } from "date-fns";
import { Form, Prisma } from "@prisma/client";
import { resetDatabase } from "../../../../../integration-tests/helper";
import prisma from "../../../../prisma";
import {
  companyFactory,
  formFactory,
  siretify,
  bsddTransporterFactory,
  userFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { Query } from "../../../../generated/graphql/types";

function createForms(
  userId: string,
  params: Partial<Prisma.FormCreateInput>[]
) {
  return Promise.all(
    params.map(p => {
      return formFactory({
        ownerId: userId,
        opt: p
      });
    })
  );
}

function createNForms(
  userId: string,
  param: Partial<Prisma.FormCreateInput>,
  n: number
) {
  return createForms(userId, Array(n).fill(param));
}

// Created n forms sequentially in order to have a
// strict ordering on the field `createdAt`
async function createNSortedForms(
  userId: string,
  opt: Partial<Prisma.FormCreateInput>,
  n: number
) {
  const forms: Form[] = [];
  for (const _ of Array(n)) {
    const form = await formFactory({ ownerId: userId, opt });
    forms.push(form);
  }
  return forms;
}

const FORMS = `
  query Forms(
    $siret: String,
    $status: [FormStatus!],
    $roles: [FormRole!],
    $skip: Int,
    $first: Int,
    $last: Int,
    $cursorBefore: ID,
    $cursorAfter: ID) {
      forms(
        siret: $siret
        status: $status
        roles: $roles
        skip: $skip
        first: $first
        last: $last
        cursorBefore: $cursorBefore
        cursorAfter: $cursorAfter
        ) {
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
            packagingInfos {
              type
              quantity
            }
          }
          stateSummary {
            packagingInfos {
              type
              quantity
            }
          }
      }
  }
`;

describe("Query.forms", () => {
  afterEach(() => resetDatabase());

  it("should return forms for which user is emitter or receiver", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const recipientCompanySiret = siretify(5);
    // 4 forms
    // - 2 as recipient
    // - 1 as emitter
    // - 1 where user is owner but nothing else
    await createForms(user.id, [
      {
        recipientCompanyName: company.name,
        recipientCompanySiret: company.siret,
        recipientsSirets: [company.siret!]
      },
      {
        recipientCompanyName: company.name,
        recipientCompanySiret: company.siret,
        recipientsSirets: [company.siret!]
      },
      {
        emitterCompanyName: company.name,
        emitterCompanySiret: company.siret,
        recipientsSirets: [company.siret!]
      },
      {
        recipientCompanyName: "a name",
        recipientCompanySiret,
        recipientsSirets: [recipientCompanySiret]
      }
    ]);

    const { query } = makeClient(user);
    const { data } = await query<Pick<Query, "forms">>(FORMS);

    expect(data.forms.length).toBe(3);
    expect(
      data.forms.filter(f => f.recipient!.company!.siret === company.siret)
        .length
    ).toBe(2);
    expect(
      data.forms.filter(f => f.emitter!.company!.siret === company.siret).length
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
    const { data } = await query<Pick<Query, "forms">>(FORMS);

    const eoForms = data.forms.filter(
      f => f.ecoOrganisme?.siret === company.siret
    );
    expect(eoForms.length).toBe(1);
  });

  it("should filter by siret", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const otherCompany = await companyFactory();
    await prisma.companyAssociation.create({
      data: {
        company: { connect: { id: otherCompany.id } },
        user: { connect: { id: user.id } },
        role: "ADMIN"
      }
    });

    // 1 form on each company
    await createForms(user.id, [
      {
        recipientCompanyName: company.name,
        recipientCompanySiret: company.siret,
        recipientsSirets: [company.siret!]
      },
      {
        recipientCompanyName: otherCompany.name,
        recipientCompanySiret: otherCompany.siret,
        recipientsSirets: [otherCompany.siret!]
      }
    ]);

    const { query } = makeClient(user);
    const { data } = await query<Pick<Query, "forms">>(FORMS, {
      variables: {
        siret: otherCompany.siret
      }
    });

    expect(data.forms.length).toBe(1);
    expect(data.forms[0].recipient!.company!.siret).toBe(otherCompany.siret);
  });

  it("should return forms for which user is intermediary when filtering on siret", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");

    // Create form associated to the EO
    await formFactory({
      ownerId: user.id,
      opt: {
        intermediaries: {
          create: {
            siret: company.siret!,
            name: company.name,
            contact: "John Doe"
          }
        },
        intermediariesSirets: [company.siret!]
      }
    });

    const { query } = makeClient(user);
    const { data } = await query<Pick<Query, "forms">>(FORMS, {
      variables: {
        siret: company.siret
      }
    });

    expect(data.forms.length).toBe(1);
  });

  it("should convert packagingInfos to an empty array if null", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");

    await formFactory({
      ownerId: user.id,
      opt: {
        recipientCompanySiret: company.siret,
        recipientsSirets: [company.siret!],
        wasteDetailsPackagingInfos: [{ type: "CITERNE", quantity: 1 }]
      }
    });
    await formFactory({
      ownerId: user.id,
      opt: {
        recipientCompanySiret: company.siret,
        recipientsSirets: [company.siret!],
        wasteDetailsPackagingInfos: []
      }
    });
    await formFactory({
      ownerId: user.id,
      opt: {
        recipientCompanySiret: company.siret,
        recipientsSirets: [company.siret!],
        wasteDetailsPackagingInfos: []
      }
    });

    const { query } = makeClient(user);
    const { data, errors } = await query<Pick<Query, "forms">>(FORMS);

    expect(errors).toBeUndefined();
    expect(data.forms.length).toBe(3);

    expect(data.forms).toEqual([
      expect.objectContaining({
        wasteDetails: { packagingInfos: [] },
        stateSummary: { packagingInfos: [] }
      }),
      expect.objectContaining({
        wasteDetails: { packagingInfos: [] },
        stateSummary: { packagingInfos: [] }
      }),
      expect.objectContaining({
        wasteDetails: { packagingInfos: [{ type: "CITERNE", quantity: 1 }] },
        stateSummary: { packagingInfos: [{ type: "CITERNE", quantity: 1 }] }
      })
    ]);
  });

  it("should return deprecated packagings fields, consistent with packagingInfos", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    await createForms(user.id, [
      {
        recipientCompanySiret: company.siret,
        recipientsSirets: [company.siret!],
        wasteDetailsPackagingInfos: [
          { type: "FUT", quantity: 2 },
          { type: "AUTRE", other: "Contenant", quantity: 3 }
        ]
      }
    ]);

    const { query } = makeClient(user);
    const { data, errors } = await query<Pick<Query, "forms">>(
      `query {
          forms {
            wasteDetails {
              packagingInfos {
                type
                other
                quantity
              }
              packagings
              otherPackaging
              numberOfPackages
            }
          }
        }
      `
    );

    expect(errors).toBeUndefined();
    expect(data.forms.length).toBe(1);

    expect(data.forms).toEqual([
      {
        wasteDetails: {
          packagingInfos: [
            { type: "FUT", other: null, quantity: 2 },
            { type: "AUTRE", other: "Contenant", quantity: 3 }
          ],
          packagings: ["FUT", "AUTRE"],
          otherPackaging: "Contenant",
          numberOfPackages: 5
        }
      }
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
    const { data } = await query<Pick<Query, "forms">>(FORMS);

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
        recipientsSirets: [company.siret!],
        status: "SENT"
      },
      {
        recipientCompanyName: company.name,
        recipientCompanySiret: company.siret,
        recipientsSirets: [company.siret!],
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

    const { data: allForms } = await query<Pick<Query, "forms">>(FORMS);
    expect(allForms.forms.length).toBe(5);

    const { data: statusFiltered } = await query<Pick<Query, "forms">>(FORMS, {
      variables: {
        status: ["DRAFT", "SENT"]
      }
    });
    expect(statusFiltered.forms.length).toBe(2);

    const { data: roleFiltered } = await query<Pick<Query, "forms">>(FORMS, {
      variables: {
        roles: ["TRADER"]
      }
    });

    expect(roleFiltered.forms.length).toBe(1);

    const { data: roleAndStatusFiltered } = await query<Pick<Query, "forms">>(
      FORMS,
      {
        variables: {
          roles: ["EMITTER", "RECIPIENT"],
          status: ["PROCESSED"]
        }
      }
    );
    expect(roleAndStatusFiltered.forms.length).toBe(1);
  });

  it("should paginate forward with `first` and `skip` (descending order)", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const opts = {
      recipientCompanyName: company.name,
      recipientCompanySiret: company.siret,
      recipientsSirets: [company.siret!]
    };
    const forms = await createNSortedForms(user.id, opts, 5);
    const f4 = forms[3];
    const { query } = makeClient(user);
    const { data } = await query<Pick<Query, "forms">>(FORMS, {
      variables: { first: 1, skip: 1 }
    });
    const formIds = data.forms.map(f => f.id);
    expect(formIds).toEqual([f4.id]);
  });

  it("should paginate forward with `first` and `cursorAfter` (descending order)", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const opts = {
      recipientCompanyName: company.name,
      recipientCompanySiret: company.siret,
      recipientsSirets: [company.siret!]
    };
    const forms = await createNSortedForms(user.id, opts, 5);
    const f1 = forms[0];
    const f2 = forms[1];
    const f3 = forms[2];
    const f4 = forms[3];
    const f5 = forms[4];

    const { query } = makeClient(user);
    const { data: data1 } = await query<Pick<Query, "forms">>(FORMS, {
      variables: { first: 2 }
    });
    const page1 = data1.forms.map(f => f.id);
    expect(page1).toEqual([f5.id, f4.id]);
    const { data: data2 } = await query<Pick<Query, "forms">>(FORMS, {
      variables: {
        first: 2,
        cursorAfter: f4.id
      }
    });
    const page2 = data2.forms.map(f => f.id);
    expect(page2).toEqual([f3.id, f2.id]);
    const { data: data3 } = await query<Pick<Query, "forms">>(FORMS, {
      variables: {
        first: 2,
        cursorAfter: f2.id
      }
    });
    const page3 = data3.forms.map(f => f.id);
    expect(page3).toEqual([f1.id]);
    const { data: data4 } = await query<Pick<Query, "forms">>(FORMS, {
      variables: { first: 2, cursorAfter: f1.id }
    });
    const page4 = data4.forms.map(f => f.id);
    expect(page4).toEqual([]);
  });

  it("should paginate backward with `last` and `skip` (descending order)", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const opts = {
      recipientCompanyName: company.name,
      recipientCompanySiret: company.siret,
      recipientsSirets: [company.siret!]
    };
    const forms = await createNSortedForms(user.id, opts, 5);
    const f2 = forms[1];
    const { query } = makeClient(user);
    const { data } = await query<Pick<Query, "forms">>(FORMS, {
      variables: { last: 1, skip: 1 }
    });
    const formIds = data.forms.map(f => f.id);
    expect(formIds).toEqual([f2.id]);
  });

  it("should paginate backward with `last` and `cursorBefore` (descending order)", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const opts = {
      recipientCompanyName: company.name,
      recipientCompanySiret: company.siret,
      recipientsSirets: [company.siret!]
    };
    const forms = await createNSortedForms(user.id, opts, 5);
    const f1 = forms[0];
    const f2 = forms[1];
    const f3 = forms[2];
    const f4 = forms[3];
    const f5 = forms[4];

    const { query } = makeClient(user);
    const { data: data1 } = await query<Pick<Query, "forms">>(FORMS, {
      variables: { last: 2 }
    });
    const page1 = data1.forms.map(f => f.id);
    expect(page1).toEqual([f2.id, f1.id]);
    const { data: data2 } = await query<Pick<Query, "forms">>(FORMS, {
      variables: {
        last: 2,
        cursorBefore: f2.id
      }
    });
    const page2 = data2.forms.map(f => f.id);
    expect(page2).toEqual([f4.id, f3.id]);
    const { data: data3 } = await query<Pick<Query, "forms">>(FORMS, {
      variables: {
        last: 2,
        cursorBefore: f4.id
      }
    });
    const page3 = data3.forms.map(f => f.id);
    expect(page3).toEqual([f5.id]);
    const { data: data4 } = await query<Pick<Query, "forms">>(FORMS, {
      variables: { last: 2, cursorBefore: f5.id }
    });
    const page4 = data4.forms.map(f => f.id);
    expect(page4).toEqual([]);
  });

  it("should return 50 forms by default", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    await createNForms(
      user.id,
      {
        emitterCompanySiret: company.siret
      },
      60
    );

    const { query } = makeClient(user);
    const { data } = await query<Pick<Query, "forms">>(FORMS);
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

    await prisma.companyAssociation.create({
      data: {
        company: { connect: { id: otherCompany.id } },
        user: { connect: { id: user.id } },
        role: "ADMIN"
      }
    });

    // 1 form on each company
    await createForms(user.id, [
      {
        recipientCompanyName: company.name,
        recipientCompanySiret: company.siret,
        recipientsSirets: [company.siret!]
      },
      {
        recipientCompanyName: otherCompany.name,
        recipientCompanySiret: otherCompany.siret,
        recipientsSirets: [otherCompany.siret!]
      }
    ]);

    const { query } = makeClient(user);
    const { data } = await query<Pick<Query, "forms">>(
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
    expect(data.forms[0].recipient!.company!.siret).toBe(otherCompany.siret);
  });

  it("should filter by updatedAt", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    await createForms(user.id, [
      {
        recipientCompanyName: company.name,
        recipientCompanySiret: company.siret,
        recipientsSirets: [company.siret!]
      },
      {
        recipientCompanyName: company.name,
        recipientCompanySiret: company.siret,
        recipientsSirets: [company.siret!]
      }
    ]);

    const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd");
    const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");

    const { query } = makeClient(user);
    const { data: updatedAfterYesterday } = await query<Pick<Query, "forms">>(
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

    const { data: updatedAfterTomorrow } = await query<Pick<Query, "forms">>(
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
    const { user, company } = await userWithCompanyFactory("ADMIN");
    await createForms(user.id, [
      {
        wasteDetailsCode: "01 03 04*",
        recipientCompanyName: company.name,
        recipientCompanySiret: company.siret,
        recipientsSirets: [company.siret!]
      },
      {
        wasteDetailsCode: "01 03 05*",
        recipientCompanyName: company.name,
        recipientCompanySiret: company.siret,
        recipientsSirets: [company.siret!]
      }
    ]);

    const { query } = makeClient(user);
    const { data } = await query<Pick<Query, "forms">>(
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
    expect(data.forms[0].wasteDetails!.code).toBe("01 03 04*");
  });

  it("should filter by customId", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    await createForms(user.id, [
      {
        customId: "custom1",
        recipientCompanyName: company.name,
        recipientCompanySiret: company.siret,
        recipientsSirets: [company.siret!]
      },
      {
        customId: "custom2",
        recipientCompanyName: company.name,
        recipientCompanySiret: company.siret,
        recipientsSirets: [company.siret!]
      },
      {
        customId: null,
        recipientCompanyName: company.name,
        recipientCompanySiret: company.siret,
        recipientsSirets: [company.siret!]
      }
    ]);

    const { query } = makeClient(user);
    const { data } = await query<Pick<Query, "forms">>(
      `query Forms($customId: String) {
          forms(customId: $customId) {
            customId
          }
        }
      `,
      { variables: { customId: "custom1" } }
    );

    expect(data.forms.length).toBe(1);
    expect(data.forms[0].customId).toBe("custom1");
  });

  it("should filter by siretPresentOnForm", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const otherCompany = await companyFactory();

    await createForms(user.id, [
      {
        recipientCompanyName: company.name,
        recipientCompanySiret: company.siret,
        recipientsSirets: [company.siret!]
      },
      {
        recipientCompanyName: company.name,
        recipientCompanySiret: company.siret,
        recipientsSirets: [company.siret!],
        emitterCompanyName: otherCompany.name,
        emitterCompanySiret: otherCompany.siret
      }
    ]);

    const { query } = makeClient(user);
    const { data } = await query<Pick<Query, "forms">>(
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
    expect(data.forms[0].emitter!.company!.siret).toBe(otherCompany.siret);
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
        transportersSirets: [transporter.siret!],
        status: "SEALED",
        transporters: {
          create: {
            transporterCompanySiret: transporter.siret,
            number: 1
          }
        }
      }
    });

    // the transporter makes the query
    const { query } = makeClient(user);
    const { data } = await query<Pick<Query, "forms">>(FORMS, {
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
    const transporterCompanySiret = siretify(3);
    // create a form whose first tranporter is another one
    const form = await formFactory({
      ownerId: owner.id,
      opt: {
        transportersSirets: [transporterCompanySiret, transporter.siret!], // pre populate with the transport segment siret
        status: "SEALED",
        transporters: {
          create: {
            transporterCompanySiret,
            number: 1
          }
        }
      }
    });
    // our transporter is on one segment
    await bsddTransporterFactory({
      formId: form.id,
      opts: {
        transporterCompanySiret: transporter.siret
      }
    });

    // the transporter makes the query
    const { query } = makeClient(user);
    const { data } = await query<Pick<Query, "forms">>(FORMS, {
      variables: {
        siret: transporter.siret,
        roles: ["TRANSPORTER"]
      }
    });

    expect(data.forms.length).toBe(1);
    expect(data.forms[0].id).toBe(form.id);
  });

  it("should return my forms only if I am a foreign transporter", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN", {
      siret: null,
      orgId: "ESA15022510",
      vatNumber: "ESA15022510",
      companyTypes: {
        set: ["TRANSPORTER"]
      }
    });

    // this form should be returned
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        transportersSirets: [company.vatNumber!],
        transporters: {
          create: {
            transporterCompanySiret: null,
            transporterCompanyVatNumber: company.vatNumber,
            number: 1
          }
        }
      }
    });

    const anotherUser = await userFactory();
    // this form should not be returned
    await formFactory({ ownerId: anotherUser.id });

    const { query } = makeClient(user);

    const { data } = await query<Pick<Query, "forms">>(FORMS);

    expect(data.forms).toHaveLength(1);
    expect(data.forms[0].id).toEqual(form.id);
  });

  it("should not return draft forms for which user is present but not the owner", async () => {
    const { user: owner, company: ownerCompany } = await userWithCompanyFactory(
      "ADMIN"
    );
    const { user, company } = await userWithCompanyFactory("ADMIN", {
      companyTypes: {
        set: ["WASTEPROCESSOR"]
      }
    });

    // Create form associated to the EO
    await formFactory({
      ownerId: owner.id,
      opt: {
        status: "DRAFT",
        emitterCompanySiret: ownerCompany.siret,
        emitterCompanyName: ownerCompany.name,
        recipientCompanySiret: company.name,
        recipientCompanyName: company.siret
      }
    });

    const { query } = makeClient(user);
    const { data } = await query<Pick<Query, "forms">>(FORMS);

    const forms = data.forms.filter(
      f => f.recipient?.company?.siret === company.siret
    );
    expect(forms.length).toBe(0);
  });

  it("should return draft forms for which user is the owner", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");

    // Create form associated to the EO
    await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterCompanySiret: company.siret,
        emitterCompanyName: company.name
      }
    });

    const { query } = makeClient(user);
    const { data } = await query<Pick<Query, "forms">>(FORMS);

    const forms = data.forms.filter(
      f => f.emitter?.company?.siret === company.siret
    );
    expect(forms.length).toBe(1);
  });
});
