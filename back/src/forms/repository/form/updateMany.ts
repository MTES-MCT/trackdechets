import { Prisma } from "@prisma/client";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";
import { enqueueBsdToIndex } from "../../../queue/producers/elastic";

export type UpdateManyFormFn = (
  ids: string[],
  data: Prisma.FormUpdateInput,
  logMetadata?: LogMetadata
) => Promise<Prisma.BatchPayload>;

const buildUpdateManyForms: (deps: RepositoryFnDeps) => UpdateManyFormFn =
  deps => async (ids, data, logMetadata) => {
    const { prisma, user } = deps;

    const update = await prisma.form.updateMany({
      where: { id: { in: ids } },
      data
    });

    await prisma.event.createMany({
      data: ids.map(id => ({
        streamId: id,
        actor: user.id,
        type: "BsddUpdated",
        data: { content: data } as Prisma.InputJsonObject,
        metadata: { ...logMetadata, authType: user.auth }
      }))
    });

    const forms = await prisma.form.findMany({
      where: { id: { in: ids } },
      select: { readableId: true }
    });

    for (const { readableId } of forms) {
      prisma.addAfterCommitCallback(() => enqueueBsdToIndex(readableId));
    }

    return update;
  };

export default buildUpdateManyForms;
