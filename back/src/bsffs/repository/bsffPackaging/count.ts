import { Prisma } from "@prisma/client";
import { ReadRepositoryFnDeps } from "../../../common/repository/types";

export type CountBsffPackagingFn = (
  args: Prisma.BsffPackagingCountArgs
) => Promise<number>;

export function buildCountBsffPackaging({
  prisma
}: ReadRepositoryFnDeps): CountBsffPackagingFn {
  return async args => {
    return prisma.bsffPackaging.count(args);
  };
}
