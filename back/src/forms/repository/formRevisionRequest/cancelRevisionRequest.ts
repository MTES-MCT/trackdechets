import { BsddRevisionRequest, Prisma } from "@prisma/client";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";
import { enqueueUpdatedBsdToIndex } from "../../../queue/producers/elastic";

export type CancelRevisionRequestFn = (
  where: Prisma.BsddRevisionRequestWhereUniqueInput,
  logMetadata?: LogMetadata
) => Promise<BsddRevisionRequest>;

const buildCancelRevisionRequest: (
  deps: RepositoryFnDeps
) => CancelRevisionRequestFn =
  ({ prisma, user }) =>
  async (where, logMetadata) => {
    const deletedRevisionRequest = await prisma.bsddRevisionRequest.delete({
      where
    });

    await prisma.event.create({
      data: {
        streamId: deletedRevisionRequest.id,
        actor: user.id,
        type: "BsddRevisionRequestCancelled",
        data: {},
        metadata: { ...logMetadata, authType: user.auth }
      }
    });

    const bsdd = await prisma.form.findUniqueOrThrow({
      where: { id: deletedRevisionRequest.bsddId },
      select: { readableId: true }
    });

    prisma.addAfterCommitCallback(() =>
      enqueueUpdatedBsdToIndex(bsdd.readableId)
    );

    return deletedRevisionRequest;
  };

export default buildCancelRevisionRequest;
