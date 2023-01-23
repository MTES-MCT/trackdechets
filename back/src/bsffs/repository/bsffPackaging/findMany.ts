import { BsffPackaging, Prisma } from "@prisma/client";
import { ReadRepositoryFnDeps } from "../../../common/repository/types";

export type FindManyBsffPackagingsFn = (
  args: Prisma.BsffPackagingFindManyArgs
) => Promise<BsffPackaging[]>;

export function buildFindManyBsffPackagings({
  prisma
}: ReadRepositoryFnDeps): FindManyBsffPackagingsFn {
  return args => {
    return prisma.bsffPackaging.findMany(args);
  };
}
