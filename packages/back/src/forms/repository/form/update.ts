import { Form, Prisma } from "@prisma/client";
import { GraphQLContext } from "../../../types";
import { indexForm } from "../../elastic";
import { LogMetadata, RepositoryFnDeps } from "../types";
import buildFindFullFormById from "./findFullFormById";

export type UpdateFormFn = (
  where: Prisma.FormWhereUniqueInput,
  data: Prisma.FormUpdateInput,
  logMetadata?: LogMetadata
) => Promise<Form>;

const buildUpdateForm: (deps: RepositoryFnDeps) => UpdateFormFn =
  deps => async (where, data, logMetadata) => {
    const { user, prisma } = deps;

    const updatedForm = await prisma.form.update({
      where,
      data
    });

    await prisma.event.create({
      data: {
        streamId: updatedForm.id,
        actor: user.id,
        type: "BsddUpdated",
        data: { content: data } as Prisma.InputJsonObject,
        metadata: { ...logMetadata, authType: user.auth }
      }
    });

    const fullForm = await buildFindFullFormById(deps)(updatedForm.id);
    await indexForm(fullForm, { user } as GraphQLContext);

    return updatedForm;
  };

export default buildUpdateForm;
