import { EmitterType, Form, Prisma } from "@prisma/client";
import { deleteBsd } from "../../../common/elastic";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";
import { GraphQLContext } from "../../../types";
import buildRemoveAppendix2 from "./removeAppendix2";
import buildUpdateManyForms from "./updateMany";
import { enqueueDeletedFormWebhook } from "../../../queue/producers/webhooks";

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
      await Promise.all(
        appendix1.map(({ initialFormId }) =>
          deleteBsd({ id: initialFormId }, { user } as GraphQLContext)
        )
      );
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

    await deleteBsd({ id: deletedForm.id }, { user } as GraphQLContext);

    if (deletedForm.forwardedInId) {
      await deleteBsd({ id: deletedForm.forwardedInId }, {
        user
      } as GraphQLContext);
    }

    if (deletedForm.emitterType === EmitterType.APPENDIX2) {
      // disconnect appendix2 forms if any
      const removeAppendix2 = buildRemoveAppendix2({ prisma, user });
      await removeAppendix2(deletedForm.id);
    }
    prisma.addAfterCommitCallback(() =>
      enqueueDeletedFormWebhook(deletedForm.id)
    );
    return deletedForm;
  };

export default buildDeleteForm;
