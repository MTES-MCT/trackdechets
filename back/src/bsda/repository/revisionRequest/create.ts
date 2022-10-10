import { BsdaRevisionRequest, Prisma } from "@prisma/client";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";
import { approveAndApplyRevisionRequest } from "./accept";

export type CreateRevisionRequestFn = (
  data: Prisma.BsdaRevisionRequestCreateInput,
  logMetadata?: LogMetadata
) => Promise<BsdaRevisionRequest>;

export function buildCreateRevisionRequest(
  deps: RepositoryFnDeps
): CreateRevisionRequestFn {
  return async (data, logMetadata?) => {
    const { prisma, user } = deps;

    const revisionRequest = await prisma.bsdaRevisionRequest.create({
      data,
      include: { approvals: true }
    });

    await prisma.event.create({
      data: {
        streamId: revisionRequest.id,
        actor: user.id,
        type: "BsdaRevisionRequestCreated",
        data: data as Prisma.InputJsonObject,
        metadata: { ...logMetadata, authType: user.auth }
      }
    });

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
