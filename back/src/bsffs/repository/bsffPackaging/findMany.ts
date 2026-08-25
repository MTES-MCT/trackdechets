import { Prisma } from "@td/prisma";
import { ReadRepositoryFnDeps } from "../../../common/repository/types";

export type FindManyBsffPackagingsFn = <
  Args extends Prisma.BsffPackagingFindManyArgs
>(
  args: Args
) => Promise<Prisma.BsffPackagingGetPayload<Args>[]>;

export function buildFindManyBsffPackagings({
  prisma
}: ReadRepositoryFnDeps): FindManyBsffPackagingsFn {
  return async <Args extends Prisma.BsffPackagingFindManyArgs>(args: Args) => {
    return prisma.bsffPackaging.findMany(args) as Promise<
      Prisma.BsffPackagingGetPayload<Args>[]
    >;
  };
}
