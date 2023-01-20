import { Bsff, Prisma } from "@prisma/client";
import { ReadRepositoryFnDeps } from "../../../common/repository/types";

export type FindManyBsffFn = (args: Prisma.BsffFindManyArgs) => Promise<Bsff[]>;

export function buildFindManyBsff({
  prisma
}: ReadRepositoryFnDeps): FindManyBsffFn {
  return args => {
    return prisma.bsff.findMany({
      ...args,
      where: { ...(args.where ?? {}), isDeleted: false }
    });
  };
}
