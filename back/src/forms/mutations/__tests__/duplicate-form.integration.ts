import {
  formFactory,
  userWithCompanyFactory
} from "../../../__tests__/factories";
import makeClient from "../../../__tests__/testClient";
import { prisma } from "../../../generated/prisma-client";
import { cleanUpNotDuplicatableFieldsInForm } from "../../form-converter";
import { resetDatabase } from "../../../../integration-tests/helper";

describe("{ mutation { duplicateForm } }", () => {
  afterAll(() => resetDatabase());

  it("should duplicate an existing form", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const form = await formFactory({
      ownerId: user.id,
      opt: { emitterCompanySiret: company.siret }
    });

    const { mutate } = makeClient(user);

    const mutation = `
      mutation {
        duplicateForm(id: "${form.id}") {
          id
        }
      }
    `;

    const { data } = await mutate(mutation);

    const duplicateForm = await prisma.form({ id: data.duplicateForm.id });

    expect(cleanUpNotDuplicatableFieldsInForm(form)).toEqual(
      cleanUpNotDuplicatableFieldsInForm(duplicateForm)
    );

    // check relevant statusLog is created
    const statusLogs = await prisma.statusLogs({
      where: {
        form: { id: duplicateForm.id },
        user: { id: user.id },
        status: "DRAFT"
      }
    });
    expect(statusLogs.length).toEqual(1);
    expect(statusLogs[0].loggedAt).toBeTruthy();
  });
});
