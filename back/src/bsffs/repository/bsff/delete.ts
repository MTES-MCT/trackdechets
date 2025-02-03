import { Prisma } from "@prisma/client";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";
import { enqueueBsdToDelete } from "../../../queue/producers/elastic";
import { buildUpdateManyBsffPackagings } from "../bsffPackaging/updateMany";
import { bsffEventTypes } from "../types";
import { buildFindUniqueBsffGetPackagings } from "./findUnique";

export type DeleteBsffFn = <Args extends Prisma.BsffDeleteArgs>(
  args: Args,
  logMetadata?: LogMetadata
) => Promise<Prisma.BsffGetPayload<Args>>;

export function buildDeleteBsff(deps: RepositoryFnDeps): DeleteBsffFn {
  return async <Args extends Prisma.BsffDeleteArgs>(
    args: Args,
    logMetadata?: LogMetadata
  ) => {
    const { prisma, user } = deps;

    const findUniqueGetPackagings = buildFindUniqueBsffGetPackagings(deps);
    const updateManyPackagings = buildUpdateManyBsffPackagings(deps);

    const packagings =
      (await findUniqueGetPackagings({ where: args.where })) ?? [];

    // disconnect previous packagings
    await updateManyPackagings({
      where: {
        nextPackagingId: { in: packagings.map(p => p.id) }
      },
      data: { nextPackagingId: null }
    });

    const deletedBsff = await prisma.bsff.update({
      ...args,
      data: {
        isDeleted: true
      }
    });

    await prisma.event.create({
      data: {
        streamId: deletedBsff.id,
        actor: user.id,
        type: bsffEventTypes.deleted,
        data: {},
        metadata: { ...logMetadata, authType: user.auth }
      }
    });

    prisma.addAfterCommitCallback(() => enqueueBsdToDelete(deletedBsff.id));

    return deletedBsff as Prisma.BsffGetPayload<Args>;
  };
}
