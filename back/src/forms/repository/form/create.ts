import { Form, Prisma } from "@prisma/client";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";
import { enqueueBsdToIndex } from "../../../queue/producers/elastic";
import { getFormSiretsByRole } from "../../database";

export type CreateFormFn = (
  data: Prisma.FormCreateInput,
  logMetadata?: LogMetadata
) => Promise<Form>;

const buildCreateForm: (deps: RepositoryFnDeps) => CreateFormFn =
  deps => async (data, logMetadata?) => {
    const { prisma, user } = deps;

    const form = await prisma.form.create({
      data,
      include: {
        transportSegments: true,
        intermediaries: true,
        forwardedIn: true
      }
    });

    // Deducting every sirets from a Prisma.FormCreateInput object is far from trivial
    // It's safer to fill the denormalized sirets after the creation
    const denormalizedSirets = getFormSiretsByRole(form);
    await prisma.form.update({
      where: { id: form.id },
      data: denormalizedSirets
    });

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

    prisma.addAfterCommitCallback(() => enqueueBsdToIndex(form.readableId));

    return form;
  };

export default buildCreateForm;
