import { Prisma } from "@td/prisma";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";
import { enqueueBsdToDelete } from "../../../queue/producers/elastic";
import { bsvhuEventTypes } from "./eventTypes";
import {
  BsvhuWithTransporters,
  BsvhuWithTransportersInclude
} from "../../types";

export type DeleteBsvhuFn = (
  where: Prisma.BsvhuWhereUniqueInput,
  logMetadata?: LogMetadata
) => Promise<BsvhuWithTransporters>;

export function buildDeleteBsvhu(deps: RepositoryFnDeps): DeleteBsvhuFn {
  return async (where, logMetadata) => {
    const { user, prisma } = deps;
    const deletedBsvhu = await prisma.bsvhu.update({
      where,
      data: {
        isDeleted: true
      },
      include: BsvhuWithTransportersInclude
    });

    await prisma.event.create({
      data: {
        streamId: deletedBsvhu.id,
        actor: user.id,
        type: bsvhuEventTypes.deleted,
        data: {},
        metadata: { ...logMetadata, authType: user.auth }
      }
    });

    prisma.addAfterCommitCallback(() => enqueueBsdToDelete(deletedBsvhu.id));

    return deletedBsvhu;
  };
}
