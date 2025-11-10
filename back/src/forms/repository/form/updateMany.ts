import { Prisma } from "@td/prisma";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";
import { enqueueUpdatedBsdToIndex } from "../../../queue/producers/elastic";
import { getFormSiretsByRole, SIRETS_BY_ROLE_INCLUDE } from "../../database";
import { checkIfHasPossibleSiretChange } from "./update";

export type UpdateManyFormFn = (
  ids: string[],
  data: Prisma.FormUpdateManyMutationInput,
  logMetadata?: LogMetadata
) => Promise<Prisma.BatchPayload>;

const buildUpdateManyForms: (deps: RepositoryFnDeps) => UpdateManyFormFn =
  deps => async (ids, data, logMetadata) => {
    const { prisma, user } = deps;
    const where = { id: { in: ids } };

    const update = await prisma.form.updateMany({
      where,
      data
    });

    // WARNING : This is costly !
    if (checkIfHasPossibleSiretChange(data)) {
      const forms = await prisma.form.findMany({
        where,
        include: SIRETS_BY_ROLE_INCLUDE
      });
      await Promise.all(
        forms.map(form => {
          return prisma.form.update({
            where: { id: form.id },
            data: getFormSiretsByRole(form)
          });
        })
      );
    }

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
      where: { id: { in: ids } }
      // select: { readableId: true }
    });

    for (const form of forms) {
      prisma.addAfterCommitCallback(() =>
        enqueueUpdatedBsdToIndex(form.readableId)
      );
    }

    return update;
  };

export default buildUpdateManyForms;
