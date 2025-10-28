import { BsdasriRevisionRequest, Prisma } from "@td/prisma";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";
import { approveAndApplyRevisionRequest } from "./accept";
import { enqueueUpdatedBsdToIndex } from "../../../queue/producers/elastic";

export type CreateRevisionRequestFn = (
  data: Prisma.BsdasriRevisionRequestCreateInput,
  logMetadata?: LogMetadata
) => Promise<BsdasriRevisionRequest>;

export function buildCreateRevisionRequest(
  deps: RepositoryFnDeps
): CreateRevisionRequestFn {
  return async (data, logMetadata?) => {
    const { prisma, user } = deps;

    const revisionRequest = await prisma.bsdasriRevisionRequest.create({
      data,
      include: { approvals: true }
    });

    await prisma.event.create({
      data: {
        streamId: revisionRequest.id,
        actor: user.id,
        type: "BsdasriRevisionRequestCreated",
        data: data as Prisma.InputJsonObject,
        metadata: { ...logMetadata, authType: user.auth }
      }
    });

    // touch the bsd to make it come up in the dashboard
    await prisma.bsdasri.update({
      where: {
        id: revisionRequest.bsdasriId
      },
      data: {
        updatedAt: new Date()
      },
      select: {
        id: true
      }
    });

    prisma.addAfterCommitCallback(() =>
      enqueueUpdatedBsdToIndex(revisionRequest.bsdasriId)
    );

    if (revisionRequest.approvals.length > 0) {
      return revisionRequest;
    }

    // 0 approvals, auto-approve
    return approveAndApplyRevisionRequest(revisionRequest.id, {
      prisma,
      user,
      logMetadata
    });
  };
}
