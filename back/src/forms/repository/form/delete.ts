import { EmitterType, Form, Prisma } from "@prisma/client";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";
import buildRemoveAppendix2 from "./removeAppendix2";
import buildUpdateManyForms from "./updateMany";
import { enqueueDeletedFormWebhook } from "../../../queue/producers/webhooks";
import { enqueueBsdToDelete } from "../../../queue/producers/elastic";

export type DeleteFormFn = (
  where: Prisma.FormWhereUniqueInput,
  logMetadata?: LogMetadata
) => Promise<Form>;

const buildDeleteForm: (deps: RepositoryFnDeps) => DeleteFormFn =
  deps => async (where, logMetadata) => {
    const { user, prisma } = deps;

    const deletedForm = await prisma.form.update({
      where,
      data: { isDeleted: true }
    });

    if (deletedForm.forwardedInId) {
      await prisma.form.update({
        where,
        data: { forwardedIn: { update: { isDeleted: true } } }
      });
    }

    // Removing an appendix1 container removes the appendix 1
    if (deletedForm.emitterType === EmitterType.APPENDIX1) {
      const appendix1 = await prisma.formGroupement.findMany({
        where: { nextFormId: deletedForm.id },
        select: { initialFormId: true }
      });

      const updateManyForms = buildUpdateManyForms({ prisma, user });
      await updateManyForms(
        appendix1.map(form => form.initialFormId),
        { isDeleted: true }
      );
      prisma.addAfterCommitCallback(() => {
        for (const { initialFormId } of appendix1) {
          enqueueBsdToDelete(initialFormId);
        }
      });
    }

    // Removing an appendix1 unlinks it with its container
    if (deletedForm.emitterType === EmitterType.APPENDIX1_PRODUCER) {
      await prisma.formGroupement.deleteMany({
        where: { initialFormId: deletedForm.id }
      });
    }

    await prisma.event.create({
      data: {
        streamId: deletedForm.id,
        actor: user.id,
        type: "BsddDeleted",
        data: {},
        metadata: { ...logMetadata, authType: user.auth }
      }
    });

    prisma.addAfterCommitCallback(() => {
      enqueueBsdToDelete(deletedForm.id);
      if (deletedForm.forwardedInId) {
        enqueueBsdToDelete(deletedForm.forwardedInId);
      }

      enqueueDeletedFormWebhook(deletedForm.id);
    });

    if (deletedForm.emitterType === EmitterType.APPENDIX2) {
      // disconnect appendix2 forms if any
      const removeAppendix2 = buildRemoveAppendix2({ prisma, user });
      await removeAppendix2(deletedForm.id);
    }

    return deletedForm;
  };

export default buildDeleteForm;
