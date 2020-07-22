import { resetDatabase } from "../../../../integration-tests/helper";
import makeClient from "../../../__tests__/testClient";
import { userFactory, formFactory } from "../../../__tests__/factories";
import { prisma } from "../../../generated/prisma-client";

const DELETE_FORM = `
  mutation DeleteForm($id: ID!) {
    deleteForm(id: $id) {
      id
    }
  }
`;

describe("Mutation.deleteForm", () => {
  afterEach(async () => resetDatabase());

  it("should mark a form as deleted", async () => {
    const user = await userFactory();
    const form = await formFactory({
      ownerId: user.id
    });

    const { mutate } = makeClient(user);
    await mutate(DELETE_FORM, {
      variables: { id: form.id }
    });

    const deletedForm = await prisma.form({ id: form.id });
    expect(deletedForm!.isDeleted).toBe(true);
  });

  it("should mark a form as deleted based on its readable id", async () => {
    const user = await userFactory();
    const form = await formFactory({
      ownerId: user.id
    });

    const { mutate } = makeClient(user);
    await mutate(DELETE_FORM, {
      variables: { id: form.readableId }
    });

    const deletedForm = await prisma.form({ id: form.id });
    expect(deletedForm!.isDeleted).toBe(true);
  });
});
