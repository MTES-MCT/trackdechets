import { Form, Prisma } from "@prisma/client";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";
import { GraphQLContext } from "../../../types";
import { indexForm } from "../../elastic";
import buildFindFullFormById from "./findFullFormById";

export type CreateFormFn = (
  data: Prisma.FormCreateInput,
  logMetadata?: LogMetadata
) => Promise<Form>;

const buildCreateForm: (deps: RepositoryFnDeps) => CreateFormFn =
  deps => async (data, logMetadata?) => {
    const { prisma, user } = deps;

    const form = await prisma.form.create({ data });

    await prisma.statusLog.create({
      data: {
        form: { connect: { id: form.id } },
        user: { connect: { id: user.id } },
        status: form.status,
        updatedFields: {},
        authType: user.auth,
        loggedAt: form.createdAt
      }
    });

    await prisma.event.create({
      data: {
        streamId: form.id,
        actor: user.id,
        type: "BsddCreated",
        data: { content: data } as Prisma.InputJsonObject,
        metadata: { ...logMetadata, authType: user.auth }
      }
    });

    const fullForm = await buildFindFullFormById(deps)(form.id);
    await indexForm(fullForm, { user } as GraphQLContext);

    return form;
  };

export default buildCreateForm;
