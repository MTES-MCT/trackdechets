import { BsddRevisionRequest, Prisma } from "@prisma/client";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";
import { approveAndApplyRevisionRequest } from "./acceptRevisionRequestApproval";
import { enqueueUpdatedBsdToIndex } from "../../../queue/producers/elastic";

export type CreateRevisionRequestFn = (
  data: Prisma.BsddRevisionRequestCreateInput,
  logMetadata?: LogMetadata
) => Promise<BsddRevisionRequest>;

const buildCreateRevisionRequest: (
  deps: RepositoryFnDeps
) => CreateRevisionRequestFn =
  ({ prisma, user }) =>
  async (data, logMetadata) => {
    const createdRevisionRequest = await prisma.bsddRevisionRequest.create({
      data,
      include: { approvals: true, bsdd: { select: { readableId: true } } }
    });

    await prisma.event.create({
      data: {
        streamId: createdRevisionRequest.id,
        actor: user.id,
        type: "BsddRevisionRequestCreated",
        data: { content: data } as Prisma.InputJsonObject,
        metadata: { ...logMetadata, authType: user.auth }
      }
    });

    prisma.addAfterCommitCallback(() =>
      enqueueUpdatedBsdToIndex(createdRevisionRequest.bsdd.readableId)
    );

    if (createdRevisionRequest.approvals.length > 0) {
      return createdRevisionRequest;
    }

    // 0 approvals, auto-approve
    return approveAndApplyRevisionRequest(createdRevisionRequest.id, {
      prisma,
      user,
      logMetadata
    });
  };

export default buildCreateRevisionRequest;
