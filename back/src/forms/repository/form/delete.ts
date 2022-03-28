import { Form, Prisma } from "@prisma/client";
import { deleteBsd } from "../../../common/elastic";
import { GraphQLContext } from "../../../types";
import { LogMetadata, RepositoryFnDeps } from "../types";

export type DeleteFormFn = (
  where: Prisma.FormWhereUniqueInput,
  logMetadata?: LogMetadata
) => Promise<Form>;

const buildDeleteForm: (deps: RepositoryFnDeps) => DeleteFormFn =
  deps => async (where, logMetadata) => {
    const { user, prisma } = deps;

    const deletedForm = await prisma.form.update({
      where,
      data: { isDeleted: true, appendix2Forms: { set: [] } }
    });

    await prisma.event.create({
      data: {
        streamId: deletedForm.id,
        actor: user.id,
        type: "BsddDeleted",
        data: {},
        metadata: { ...logMetadata, authType: user.auth }
      }
    });

    await deleteBsd(deletedForm, { user } as GraphQLContext);
    return deletedForm;
  };

export default buildDeleteForm;
