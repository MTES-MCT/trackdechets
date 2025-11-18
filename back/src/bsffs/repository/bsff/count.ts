import { Prisma } from "@td/prisma";
import { ReadRepositoryFnDeps } from "../../../common/repository/types";

export type CountBsffFn = (args: Prisma.BsffCountArgs) => Promise<number>;

export function buildCountBsff({ prisma }: ReadRepositoryFnDeps): CountBsffFn {
  return async args => {
    return prisma.bsff.count(args);
  };
}
