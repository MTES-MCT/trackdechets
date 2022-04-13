import { Form as PrismaForm, Prisma, UserRole } from "@prisma/client";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { Query } from "../../../../generated/graphql/types";
import {
  formFactory,
  toIntermediaryCompany,
  transportSegmentFactory,
  userFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";

const GET_FORM_QUERY = `
  query GetForm($id: ID, $readableId: String) {
    form(id: $id, readableId: $readableId) {
      id
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
        [`${type}CompanySiret`]: company.siret
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

    await transportSegmentFactory({
      formId: form.id,
      segmentPayload: { transporterCompanySiret: company.siret }
    });

    const { query } = makeClient(user);
    const { data } = await query<Pick<Query, "form">>(GET_FORM_QUERY, {
      variables: {
        id: form.id
      }
    });

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
});
