import { Prisma } from "@prisma/client";
import { ReadRepositoryFnDeps } from "../../../common/repository/types";

export type FindManyBsffFn = <Args extends Prisma.BsffFindManyArgs>(
  args: Args
) => Promise<Prisma.BsffGetPayload<Args>[]>;

export function buildFindManyBsff({
  prisma
}: ReadRepositoryFnDeps): FindManyBsffFn {
  return async <Args extends Prisma.BsffFindManyArgs>(args: Args) => {
    const bsffs = await prisma.bsff.findMany({
      ...args,
      where: { ...(args.where ?? {}), isDeleted: false }
    });
    return bsffs as Prisma.BsffGetPayload<Args>[];
  };
}
