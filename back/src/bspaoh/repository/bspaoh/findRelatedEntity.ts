import { Bspaoh, Prisma } from "@prisma/client";
import { ReadRepositoryFnDeps } from "../../../common/repository/types";

type ChainableBspaoh = Pick<
  Prisma.Prisma__BspaohClient<Bspaoh | null, null>,
  "transporters"
>;

export type FindRelatedEntityFn = (
  where: Prisma.BspaohWhereUniqueInput
) => ChainableBspaoh;

export function buildFindRelatedBspaohEntity({
  prisma
}: ReadRepositoryFnDeps): FindRelatedEntityFn {
  return where => {
    return prisma.bspaoh.findUnique({ where });
  };
}
