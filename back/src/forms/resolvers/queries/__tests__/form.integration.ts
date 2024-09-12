import {
  Form as PrismaForm,
  Prisma,
  UserRole,
  CiterneNotWashedOutReason,
  EmptyReturnADR
} from "@prisma/client";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { Query } from "../../../../generated/graphql/types";
import {
  formFactory,
  toIntermediaryCompany,
  bsddTransporterFactory,
  userFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import getReadableId from "../../../readableId";

const GET_FORM_QUERY = `
  query GetForm($id: ID, $readableId: String) {
    form(id: $id, readableId: $readableId) {
      id
    }
  }
`;

const GET_FORM_WITH_CITERNE_INFO_QUERY = `
  query GetForm($id: ID, $readableId: String) {
    form(id: $id, readableId: $readableId) {
      id
      hasCiterneBeenWashedOut
      citerneNotWashedOutReason
    }
  }
`;

const GET_FORM_WITH_ADR_INFO_QUERY = `
  query GetForm($id: ID, $readableId: String) {
    form(id: $id, readableId: $readableId) {
      id
      emptyReturnADR
    }
  }
`;

const GET_FORM_INTERMEDIARY_QUERY = `
  query GetForm($id: ID, $readableId: String) {
    form(id: $id, readableId: $readableId) {
      id
      intermediaries {
        name
        siret
      }
    }
  }
`;

async function createForm(
  opts: Partial<Prisma.FormCreateInput>
): Promise<PrismaForm> {
  const owner = await userFactory();
  const form = await formFactory({
    ownerId: owner.id,
    opt: opts
  });

  return form;
}

describe("Query.form", () => {
  afterEach(() => resetDatabase());

  it.each(["emitter", "recipient", "transporter"])(
    "should allow user from the %p company to read their form",
    async type => {
      const { user, company } = await userWithCompanyFactory("ADMIN");
      const form = await createForm({
        ...(type === "transporter"
          ? {
              transporters: {
                create: {
                  [`${type}CompanySiret`]: company.siret,
                  number: 1
                }
              }
            }
          : { [`${type}CompanySiret`]: company.siret })
      });

      const { query } = makeClient(user);
      const { data } = await query<Pick<Query, "form">>(GET_FORM_QUERY, {
        variables: {
          id: form.id
        }
      });

      expect(data.form.id).toBe(form.id);
    }
  );

  it("should allow a user from a transporter company part of a segment to read their form", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const form = await createForm({});

    await bsddTransporterFactory({
      formId: form.id,
      opts: { transporterCompanySiret: company.siret }
    });

    const { query } = makeClient(user);
    const { data } = await query<Pick<Query, "form">>(GET_FORM_QUERY, {
      variables: {
        id: form.id
      }
    });

    expect(data.form.id).toBe(form.id);
  });

  it("should allow a foreign multi-modal transporter N>1 to read their form", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN", {
      siret: null,
      vatNumber: "IT13029381004"
    });
    const form = await createForm({});

    await bsddTransporterFactory({
      formId: form.id,
      opts: {
        transporterCompanySiret: null,
        transporterCompanyVatNumber: company.vatNumber
      }
    });

    const { query } = makeClient(user);
    const { data, errors } = await query<Pick<Query, "form">>(GET_FORM_QUERY, {
      variables: {
        id: form.id
      }
    });

    expect(errors).toBeUndefined();

    expect(data.form.id).toBe(form.id);
  });

  it("should disallow a user with no meaningful relation to read a form", async () => {
    const user = await userFactory();
    const form = await createForm({});

    const { query } = makeClient(user);
    const { errors } = await query<Pick<Query, "form">>(GET_FORM_QUERY, {
      variables: {
        id: form.id
      }
    });

    expect(errors[0].message).toBe(
      "Vous n'êtes pas autorisé à accéder à ce bordereau"
    );
  });

  it("should return a form based on its readableId", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const form = await createForm({
      emitterCompanySiret: company.siret
    });

    const { query } = makeClient(user);
    const { data } = await query<Pick<Query, "form">>(GET_FORM_QUERY, {
      variables: {
        readableId: form.readableId
      }
    });

    expect(data.form.id).toBe(form.id);
  });

  it("should return the intermediaries", async () => {
    const { user, company } = await userWithCompanyFactory(UserRole.ADMIN);
    const intermediary = await userWithCompanyFactory(UserRole.MEMBER);
    const form = await createForm({
      emitterCompanySiret: company.siret,
      intermediaries: { create: [toIntermediaryCompany(intermediary.company)] }
    });
    const { query } = makeClient(user);
    const { data } = await query<Pick<Query, "form">>(
      GET_FORM_INTERMEDIARY_QUERY,
      {
        variables: {
          readableId: form.readableId
        }
      }
    );

    expect(data.form.intermediaries).toEqual([
      expect.objectContaining({
        name: intermediary.company.name,
        siret: intermediary.company.siret
      })
    ]);
  });

  it("should allow the intermediaries to read their form, but not sign", async () => {
    const { company } = await userWithCompanyFactory(UserRole.ADMIN);
    const intermediary = await userWithCompanyFactory(UserRole.MEMBER);
    const form = await createForm({
      emitterCompanySiret: company.siret,
      intermediaries: { create: [toIntermediaryCompany(intermediary.company)] }
    });
    const { query } = makeClient(intermediary.user);
    const { data } = await query<Pick<Query, "form">>(
      GET_FORM_INTERMEDIARY_QUERY,
      {
        variables: {
          readableId: form.readableId
        }
      }
    );

    expect(data.form.intermediaries).toEqual([
      expect.objectContaining({
        name: intermediary.company.name,
        siret: intermediary.company.siret
      })
    ]);
  });

  it("should not allow the theorical next destination to read the form, but should allow the real next destination", async () => {
    const { user } = await userWithCompanyFactory(UserRole.ADMIN);
    const { user: theroricalUser, company: theoricalCompany } =
      await userWithCompanyFactory(UserRole.ADMIN);
    const { user: realUser, company: realCompany } =
      await userWithCompanyFactory(UserRole.ADMIN);

    const form = await createForm({
      status: "AWAITING_GROUP",
      nextDestinationCompanySiret: theoricalCompany.siret,
      quantityReceived: 1,
      forwardedIn: {
        create: {
          readableId: getReadableId(),
          ownerId: user.id,
          quantityReceived: 1,
          recipientCompanySiret: realCompany.siret
        }
      }
    });

    const { query: queryTheoricalUser } = makeClient(theroricalUser);
    const { errors } = await queryTheoricalUser<Pick<Query, "form">>(
      GET_FORM_QUERY,
      {
        variables: {
          readableId: form.readableId
        }
      }
    );

    expect(errors.length).toBe(1);
    expect(errors[0].message).toBe(
      "Vous n'êtes pas autorisé à accéder à ce bordereau"
    );

    const { query: quaryRealUser } = makeClient(realUser);
    const { data } = await quaryRealUser<Pick<Query, "form">>(GET_FORM_QUERY, {
      variables: {
        readableId: form.readableId
      }
    });

    expect(data.form.id).toBe(form.id);
  });

  it("should allow user to see a draft form if he is the owner", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterCompanySiret: company.siret,
        emitterCompanyName: company.name
      }
    });

    const { query } = makeClient(user);
    const { data } = await query<Pick<Query, "form">>(GET_FORM_QUERY, {
      variables: {
        id: form.id
      }
    });

    expect(data.form.id).toBe(form.id);
  });

  it("should allow user to see a draft form if he is the owner", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterCompanySiret: company.siret,
        emitterCompanyName: company.name
      }
    });

    const { query } = makeClient(user);
    const { data } = await query<Pick<Query, "form">>(GET_FORM_QUERY, {
      variables: {
        id: form.id
      }
    });

    expect(data.form.id).toBe(form.id);
  });

  it("should not allow user to see a draft form if he is not the owner", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const { user: owner } = await userWithCompanyFactory("ADMIN");
    const form = await formFactory({
      ownerId: owner.id,
      opt: {
        status: "DRAFT",
        emitterCompanySiret: company.siret,
        emitterCompanyName: company.name
      }
    });

    const { query } = makeClient(user);
    const { errors } = await query<Pick<Query, "form">>(GET_FORM_QUERY, {
      variables: {
        id: form.id
      }
    });

    expect(errors.length).toBe(1);
    expect(errors[0].message).toBe(
      "Vous n'êtes pas autorisé à accéder à ce bordereau"
    );
  });

  it("should return citerne info", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "RECEIVED",
        emitterCompanySiret: company.siret,
        emitterCompanyName: company.name,
        hasCiterneBeenWashedOut: false,
        citerneNotWashedOutReason: CiterneNotWashedOutReason.INCOMPATIBLE
      }
    });

    // When
    const { query } = makeClient(user);
    const { errors, data } = await query<Pick<Query, "form">>(
      GET_FORM_WITH_CITERNE_INFO_QUERY,
      {
        variables: {
          id: form.id
        }
      }
    );

    expect(errors).toBeUndefined();
    expect(data.form.hasCiterneBeenWashedOut).toBeFalsy();
    expect(data.form.citerneNotWashedOutReason).toBe(
      CiterneNotWashedOutReason.INCOMPATIBLE
    );
  });

  it("should return ADR info", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "RECEIVED",
        emitterCompanySiret: company.siret,
        emitterCompanyName: company.name,
        emptyReturnADR: EmptyReturnADR.EMPTY_NOT_WASHED
      }
    });

    // When
    const { query } = makeClient(user);
    const { errors, data } = await query<Pick<Query, "form">>(
      GET_FORM_WITH_ADR_INFO_QUERY,
      {
        variables: {
          id: form.id
        }
      }
    );

    expect(errors).toBeUndefined();
    expect(data.form.emptyReturnADR).toBe(EmptyReturnADR.EMPTY_NOT_WASHED);
  });
});
