import { Prisma } from "@prisma/client";
import { ReadRepositoryFnDeps } from "../../../common/repository/types";

export type CountRndtsDeclarationDelegationsFn = (
  where: Prisma.RndtsDeclarationDelegationWhereInput
) => Promise<number>;

export function buildCountRndtsDeclarationDelegations({
  prisma
}: ReadRepositoryFnDeps): CountRndtsDeclarationDelegationsFn {
  return where => {
    return prisma.rndtsDeclarationDelegation.count({ where });
  };
}
