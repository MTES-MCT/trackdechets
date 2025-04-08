import { Bsvhu, Prisma } from "@prisma/client";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";
import { enqueueUpdatedBsdToIndex } from "../../../queue/producers/elastic";
import { bsvhuEventTypes } from "./eventTypes";
import { objectDiff } from "../../../forms/workflow/diff";
import { getCanAccessDraftOrgIds } from "../../utils";

export type UpdateBsvhuFn = (
  where: Prisma.BsvhuWhereUniqueInput,
  data: Prisma.XOR<Prisma.BsvhuUpdateInput, Prisma.BsvhuUncheckedUpdateInput>,
  logMetadata?: LogMetadata
) => Promise<Bsvhu>;

export function buildUpdateBsvhu(deps: RepositoryFnDeps): UpdateBsvhuFn {
  return async (where, data, logMetadata?) => {
    const { prisma, user } = deps;

    const previousBsvhu = await prisma.bsvhu.findUniqueOrThrow({ where });
    const bsvhu = await prisma.bsvhu.update({
      where,
      data,
      include: {
        intermediaries: true
      }
    });
    if (bsvhu.isDraft) {
      // For drafts, only the owner's sirets that appear on the bsd have access
      const canAccessDraftOrgIds = await getCanAccessDraftOrgIds(
        bsvhu,
        user.id
      );

      await prisma.bsvhu.update({
        where: { id: bsvhu.id },
        data: {
          ...(canAccessDraftOrgIds.length ? { canAccessDraftOrgIds } : {})
        },
        select: {
          id: true
        }
      });
    }
    const { updatedAt, ...updateDiff } = objectDiff(previousBsvhu, bsvhu);
    await prisma.event.create({
      data: {
        streamId: bsvhu.id,
        actor: user.id,
        type: data.status ? bsvhuEventTypes.signed : bsvhuEventTypes.updated,
        data: updateDiff,
        metadata: { ...logMetadata, authType: user.auth }
      }
    });
    prisma.addAfterCommitCallback(() => enqueueUpdatedBsdToIndex(bsvhu.id));

    return bsvhu;
  };
}
