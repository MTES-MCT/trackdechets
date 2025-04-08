import { Bsvhu, Prisma } from "@prisma/client";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";
import { enqueueCreatedBsdToIndex } from "../../../queue/producers/elastic";
import { bsvhuEventTypes } from "./eventTypes";
import { getCanAccessDraftOrgIds } from "../../utils";
export type CreateBsvhuFn = (
  data: Prisma.BsvhuCreateInput,
  logMetadata?: LogMetadata
) => Promise<Bsvhu>;

export function buildCreateBsvhu(deps: RepositoryFnDeps): CreateBsvhuFn {
  return async (data, logMetadata?) => {
    const { prisma, user } = deps;

    const bsvhu = await prisma.bsvhu.create({
      data,
      include: {
        intermediaries: true
      }
    });

    await prisma.event.create({
      data: {
        streamId: bsvhu.id,
        actor: user.id,
        type: bsvhuEventTypes.created,
        data: data as Prisma.InputJsonObject,
        metadata: { ...logMetadata, authType: user.auth }
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

    prisma.addAfterCommitCallback(() => enqueueCreatedBsdToIndex(bsvhu.id));

    return bsvhu;
  };
}
