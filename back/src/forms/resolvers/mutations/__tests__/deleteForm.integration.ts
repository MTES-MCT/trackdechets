import { resetDatabase } from "../../../../../integration-tests/helper";
import prisma from "../../../../prisma";
import { ErrorCode } from "../../../../common/errors";
import {
  formFactory,
  userFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { Mutation } from "../../../../generated/graphql/types";

const DELETE_FORM = `
mutation DeleteForm($id: ID!) {
  deleteForm(id: $id) {
    id
  }
}
`;

describe("Mutation.deleteForm", () => {
  afterEach(resetDatabase);

  it("should disallow unauthenticated user", async () => {
    const { mutate } = makeClient();

    const owner = await userFactory();
    const form = await formFactory({
      ownerId: owner.id,
      opt: { status: "DRAFT" }
    });

    const { errors } = await mutate<Pick<Mutation, "deleteForm">>(DELETE_FORM, {
      variables: { id: form.id }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: "Vous n'êtes pas connecté.",
        extensions: expect.objectContaining({
          code: ErrorCode.UNAUTHENTICATED
        })
      })
    ]);
    const intactForm = await prisma.form.findUnique({ where: { id: form.id } });
    expect(intactForm.isDeleted).toBe(false);
  });

  it("should disallow a user to delete a form they are not part of", async () => {
    const user = await userFactory();
    const owner = await userFactory();
    const form = await formFactory({
      ownerId: owner.id,
      opt: { status: "DRAFT" }
    });
    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "deleteForm">>(DELETE_FORM, {
      variables: { id: form.id }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: "Vous n'êtes pas autorisé à supprimer ce bordereau",
        extensions: expect.objectContaining({
          code: ErrorCode.FORBIDDEN
        })
      })
    ]);
    const intactForm = await prisma.form.findUnique({ where: { id: form.id } });
    expect(intactForm.isDeleted).toBe(false);
  });

  it("should not be possible to delete a signed form", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const form = await formFactory({
      ownerId: user.id,
      opt: { status: "SENT", emitterCompanySiret: company.siret }
    });
    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "deleteForm">>(DELETE_FORM, {
      variables: { id: form.id }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Seuls les bordereaux en brouillon ou en attente de collecte peuvent être supprimés",
        extensions: expect.objectContaining({
          code: ErrorCode.FORBIDDEN
        })
      })
    ]);

    const intactForm = await prisma.form.findUnique({ where: { id: form.id } });
    expect(intactForm.isDeleted).toBe(false);
  });

  it.each(["emitter", "trader", "recipient", "transporter"])(
    "should allow %p to soft delete a draft form",
    async role => {
      const { user, company } = await userWithCompanyFactory("MEMBER");
      const owner = await userFactory();
      const form = await formFactory({
        ownerId: owner.id,
        opt: { [`${role}CompanySiret`]: company.siret, status: "DRAFT" }
      });

      const { mutate } = makeClient(user);
      const { data } = await mutate<Pick<Mutation, "deleteForm">>(DELETE_FORM, {
        variables: { id: form.id }
      });

      expect(data.deleteForm.id).toBeTruthy();

      const deletedForm = await prisma.form.findUnique({
        where: { id: form.id }
      });
      expect(deletedForm.isDeleted).toBe(true);
    }
  );

  it.each(["emitter", "trader", "recipient", "transporter"])(
    "should allow %p to soft delete a sealed form",
    async role => {
      const { user, company } = await userWithCompanyFactory("MEMBER");
      const owner = await userFactory();
      const form = await formFactory({
        ownerId: owner.id,
        opt: { [`${role}CompanySiret`]: company.siret, status: "SEALED" }
      });

      const { mutate } = makeClient(user);
      const { data } = await mutate<Pick<Mutation, "deleteForm">>(DELETE_FORM, {
        variables: { id: form.id }
      });

      expect(data.deleteForm.id).toBeTruthy();

      const deletedForm = await prisma.form.findUnique({
        where: { id: form.id }
      });
      expect(deletedForm.isDeleted).toBe(true);
    }
  );

  it("should disconnect appendix 2 forms", async () => {
    const {
      user: emitterUser,
      company: emitter
    } = await userWithCompanyFactory("MEMBER");
    const { user: ttrUser, company: ttr } = await userWithCompanyFactory(
      "MEMBER"
    );
    const owner = await userFactory();
    const appendix2 = await formFactory({
      ownerId: emitterUser.id,
      opt: {
        emitterCompanySiret: emitter.siret,
        recipientCompanySiret: ttr.siret,
        status: "AWAITING_GROUP"
      }
    });
    const form = await formFactory({
      ownerId: owner.id,
      opt: {
        emitterCompanySiret: ttr.siret,
        status: "SEALED",
        appendix2Forms: { connect: [{ id: appendix2.id }] }
      }
    });

    await prisma.form.update({
      where: { id: appendix2.id },
      data: { status: "GROUPED" }
    });

    const { mutate } = makeClient(ttrUser);
    const { data } = await mutate<Pick<Mutation, "deleteForm">>(DELETE_FORM, {
      variables: { id: form.id }
    });

    expect(data.deleteForm.id).toBeTruthy();

    const deletedForm = await prisma.form.findUnique({
      where: { id: form.id },
      include: { appendix2Forms: true }
    });
    expect(deletedForm.isDeleted).toBe(true);
    expect(deletedForm.appendix2Forms).toEqual([]);

    const disconnectedAppendix2 = await prisma.form.findUnique({
      where: { id: appendix2.id }
    });
    expect(disconnectedAppendix2.appendix2RootFormId).toEqual(null);
    expect(disconnectedAppendix2.status).toEqual("AWAITING_GROUP");
  });
});
