import { resetDatabase } from "../../../../../integration-tests/helper";
import { prisma } from "../../../../generated/prisma-client";
import {
  formFactory,
  userFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";

const CANCEL_FORM = `
  mutation CancelForm($id: ID!) {
    cancelForm(id: $id) {
      id
      status
    }
  }
  `;

describe("mutation cancelForm", () => {
  afterAll(resetDatabase);

  it("should cancel a SEALED form", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const form = await formFactory({
      ownerId: user.id,
      opt: { emitterCompanySiret: company.siret, status: "SEALED" }
    });
    const { mutate } = makeClient(user);
    await mutate(CANCEL_FORM, {
      variables: { id: form.id }
    });
    const canceledForm = await prisma.form({ id: form.id });
    expect(canceledForm.status).toEqual("CANCELED");
  });

  it("should fail if form status is different than SEALED", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const form = await formFactory({
      ownerId: user.id,
      opt: { emitterCompanySiret: company.siret, status: "SENT" }
    });
    const { mutate } = makeClient(user);
    const { errors } = await mutate(CANCEL_FORM, {
      variables: { id: form.id }
    });
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toEqual(
      "Seuls les bordereaux à l'état scellé (en attente d'enlèvement) peuvent être annulés"
    );
  });

  it("should fail is user is not a form contributor", async () => {
    const owner = await userFactory();
    const user = await userFactory();
    const form = await formFactory({
      ownerId: owner.id,
      opt: { status: "SEALED" }
    });
    const { mutate } = makeClient(user);
    const { errors } = await mutate(CANCEL_FORM, {
      variables: { id: form.id }
    });
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toEqual(
      "Vous n'êtes pas autorisé à accéder à un bordereau sur lequel votre entreprise n'apparait pas."
    );
  });
});
