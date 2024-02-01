import { Prisma } from "@prisma/client";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";
import {
  enqueueBsdToDelete,
  enqueueUpdatedBsdToIndex
} from "../../../queue/producers/elastic";
import { bsdaEventTypes } from "./eventTypes";
import { BsdaWithTransporters } from "../../types";

export type DeleteBsdaFn = (
  where: Prisma.BsdaWhereUniqueInput,
  logMetadata?: LogMetadata
) => Promise<BsdaWithTransporters>;

export function buildDeleteBsda(deps: RepositoryFnDeps): DeleteBsdaFn {
  return async (where, logMetadata) => {
    const { user, prisma } = deps;

    const linkedBsdas = await prisma.bsda.findUniqueOrThrow({
      where,
      select: { forwardingId: true, grouping: { select: { id: true } } }
    });

    const deletedBsda = await prisma.bsda.update({
      where,
      data: { isDeleted: true, forwardingId: null },
      include: { transporters: true }
    });

    await prisma.bsda.updateMany({
      where: { groupedInId: deletedBsda.id },
      data: {
        groupedInId: null
      }
    });

    await prisma.event.create({
      data: {
        streamId: deletedBsda.id,
        actor: user.id,
        type: bsdaEventTypes.deleted,
        data: {},
        metadata: { ...logMetadata, authType: user.auth }
      }
    });

    prisma.addAfterCommitCallback(() => enqueueBsdToDelete(deletedBsda.id));

    const linkedBsdaIds = [
      linkedBsdas.forwardingId,
      linkedBsdas.grouping?.map(g => g.id)
    ]
      .flat()
      .filter(Boolean);

    for (const id of linkedBsdaIds) {
      prisma.addAfterCommitCallback(() => enqueueUpdatedBsdToIndex(id));
    }

    return deletedBsda;
  };
}
