import { Bsdasri, Prisma } from "@td/prisma";
import { ReadRepositoryFnDeps } from "../../../common/repository/types";

type ChainableBsdasri = Pick<
  Prisma.Prisma__BsdasriClient<Bsdasri | null, null>,
  "synthesizedIn" | "synthesizing" | "groupedIn" | "grouping" | "intermediaries"
>;

export type FindRelatedEntityFn = (
  where: Prisma.BsdasriWhereUniqueInput
) => ChainableBsdasri;

export function buildFindRelatedBsdasriEntity({
  prisma
}: ReadRepositoryFnDeps): FindRelatedEntityFn {
  return where => {
    return prisma.bsdasri.findUnique({ where });
  };
}
