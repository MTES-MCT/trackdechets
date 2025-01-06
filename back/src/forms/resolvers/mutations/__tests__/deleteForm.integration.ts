import { resetDatabase } from "../../../../../integration-tests/helper";
import { prisma } from "@td/prisma";
import { ErrorCode } from "../../../../common/errors";
import {
  formFactory,
  formWithTempStorageFactory,
  userFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import type { Mutation } from "@td/codegen-back";
import { Status } from "@prisma/client";
import { updateAppendix2Queue } from "../../../../queue/producers/updateAppendix2";
import { waitForJobsCompletion } from "../../../../queue/helpers";

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
    const intactForm = await prisma.form.findUniqueOrThrow({
      where: { id: form.id }
    });
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
    const intactForm = await prisma.form.findUniqueOrThrow({
      where: { id: form.id }
    });
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

    const intactForm = await prisma.form.findUniqueOrThrow({
      where: { id: form.id }
    });
    expect(intactForm.isDeleted).toBe(false);
  });

  it.each(["emitter", "trader", "recipient", "transporter"])(
    "should allow %p to soft delete a draft form",
    async role => {
      const { user, company } = await userWithCompanyFactory("MEMBER");
      const form = await formFactory({
        ownerId: user.id,
        opt: {
          status: "DRAFT",
          ...(role === "transporter"
            ? {
                transporters: {
                  create: {
                    [`${role}CompanySiret`]: company.siret,
                    number: 1
                  }
                }
              }
            : { [`${role}CompanySiret`]: company.siret })
        }
      });

      const { mutate } = makeClient(user);
      const { data } = await mutate<Pick<Mutation, "deleteForm">>(DELETE_FORM, {
        variables: { id: form.id }
      });

      expect(data.deleteForm.id).toBeTruthy();

      const deletedForm = await prisma.form.findUniqueOrThrow({
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
        opt: {
          status: "SEALED",
          ...(role === "transporter"
            ? {
                transporters: {
                  create: {
                    [`${role}CompanySiret`]: company.siret,
                    number: 1
                  }
                }
              }
            : { [`${role}CompanySiret`]: company.siret })
        }
      });

      const { mutate } = makeClient(user);
      const { data } = await mutate<Pick<Mutation, "deleteForm">>(DELETE_FORM, {
        variables: { id: form.id }
      });

      expect(data.deleteForm.id).toBeTruthy();

      const deletedForm = await prisma.form.findUniqueOrThrow({
        where: { id: form.id }
      });
      expect(deletedForm.isDeleted).toBe(true);
    }
  );

  it("should disconnect appendix 2 forms", async () => {
    const { user: emitterUser, company: emitter } =
      await userWithCompanyFactory("MEMBER");
    const { user: ttrUser, company: ttr } = await userWithCompanyFactory(
      "MEMBER"
    );
    const owner = await userFactory();
    const appendix2 = await formFactory({
      ownerId: emitterUser.id,
      opt: {
        emitterCompanySiret: emitter.siret,
        recipientCompanySiret: ttr.siret,
        status: "AWAITING_GROUP",
        quantityReceived: 1
      }
    });
    const form = await formFactory({
      ownerId: owner.id,
      opt: {
        emitterType: "APPENDIX2",
        emitterCompanySiret: ttr.siret,
        status: "SEALED",
        grouping: {
          create: {
            initialFormId: appendix2.id,
            quantity: appendix2.quantityReceived!.toNumber()
          }
        }
      }
    });

    await prisma.form.update({
      where: { id: appendix2.id },
      data: { status: "GROUPED" }
    });

    const { mutate } = makeClient(ttrUser);
    const mutateFn = () =>
      mutate<Pick<Mutation, "deleteForm">>(DELETE_FORM, {
        variables: { id: form.id }
      });

    const { data } = await waitForJobsCompletion({
      fn: mutateFn,
      queue: updateAppendix2Queue,
      expectedJobCount: 1
    });

    expect(data.deleteForm.id).toBeTruthy();

    const deletedForm = await prisma.form.findUniqueOrThrow({
      where: { id: form.id },
      include: { grouping: true }
    });
    expect(deletedForm.isDeleted).toBe(true);
    expect(deletedForm.grouping).toEqual([]);

    const disconnectedAppendix2 = await prisma.form.findUniqueOrThrow({
      where: { id: appendix2.id },
      include: { groupedIn: true }
    });
    expect(disconnectedAppendix2.groupedIn).toEqual([]);
    expect(disconnectedAppendix2.status).toEqual("AWAITING_GROUP");
  });

  it("should delete bsd suite", async () => {
    const { user: emitterUser, company: emitter } =
      await userWithCompanyFactory("MEMBER");
    const { forwardedIn, ...form } = await formWithTempStorageFactory({
      ownerId: emitterUser.id,
      opt: { status: Status.DRAFT, emitterCompanySiret: emitter.siret }
    });
    const { mutate } = makeClient(emitterUser);
    await mutate<Pick<Mutation, "deleteForm">>(DELETE_FORM, {
      variables: { id: form.id }
    });
    const updatedForwardedInForm = await prisma.form.findUniqueOrThrow({
      where: { id: forwardedIn!.id }
    });
    expect(updatedForwardedInForm.isDeleted).toEqual(true);
  });

  it("emitter can delete a form he is the only one to have signed", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "SIGNED_BY_PRODUCER",
        emitterCompanySiret: company.siret,
        emittedAt: new Date()
      }
    });

    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "deleteForm">>(DELETE_FORM, {
      variables: { id: form.id }
    });

    expect(data.deleteForm.id).toBeTruthy();

    const deletedForm = await prisma.form.findUniqueOrThrow({
      where: { id: form.id }
    });
    expect(deletedForm.isDeleted).toBe(true);
  });
});
