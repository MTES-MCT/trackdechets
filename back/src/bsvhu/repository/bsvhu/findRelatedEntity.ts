import { Bsvhu, Prisma } from "@prisma/client";
import { ReadRepositoryFnDeps } from "../../../common/repository/types";

type ChainableBsvhu = Pick<
  Prisma.Prisma__BsvhuClient<Bsvhu | null, null>,
  "intermediaries"
>;

export type FindRelatedEntityFn = (
  where: Prisma.BsvhuWhereUniqueInput
) => ChainableBsvhu;

export function buildFindRelatedBsvhuEntity({
  prisma
}: ReadRepositoryFnDeps): FindRelatedEntityFn {
  return where => {
    return prisma.bsvhu.findUnique({ where });
  };
}
