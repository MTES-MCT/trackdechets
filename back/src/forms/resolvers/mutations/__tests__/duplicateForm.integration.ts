import {
  formFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { prisma } from "../../../../generated/prisma-client";
import { cleanUpNotDuplicatableFieldsInForm } from "../../../form-converter";
import { resetDatabase } from "../../../../../integration-tests/helper";

const DUPLICATE_FORM = `
  mutation DuplicateForm($id: ID!) {
    duplicateForm(id: $id) {
      id
    }
  }
`;

describe("Mutation.duplicateForm", () => {
  afterEach(() => resetDatabase());

  it("should duplicate an existing form", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const form = await formFactory({
      ownerId: user.id,
      opt: { emitterCompanySiret: company.siret }
    });

    const { mutate } = makeClient(user);
    const { data } = await mutate(DUPLICATE_FORM, {
      variables: {
        id: form.id
      }
    });

    const duplicateForm = await prisma.form({
      id: data.duplicateForm.id
    });

    expect(cleanUpNotDuplicatableFieldsInForm(form)).toEqual(
      cleanUpNotDuplicatableFieldsInForm(duplicateForm)
    );
  });

  it("should create a status log", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const form = await formFactory({
      ownerId: user.id,
      opt: { emitterCompanySiret: company.siret }
    });

    const { mutate } = makeClient(user);
    const { data } = await mutate(DUPLICATE_FORM, {
      variables: {
        id: form.id
      }
    });

    const statusLogs = await prisma.statusLogs({
      where: {
        form: { id: data.duplicateForm.id },
        user: { id: user.id },
        status: "DRAFT"
      }
    });

    expect(statusLogs.length).toEqual(1);
    expect(statusLogs[0].loggedAt).toBeTruthy();
  });
});
