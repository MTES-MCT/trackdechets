import { Prisma } from "@prisma/client";
import { ReadRepositoryFnDeps } from "../../../common/repository/types";

export type CountRegistryDelegationsFn = (
  where: Prisma.RegistryDelegationWhereInput
) => Promise<number>;

export function buildCountRegistryDelegations({
  prisma
}: ReadRepositoryFnDeps): CountRegistryDelegationsFn {
  return where => {
    return prisma.registryDelegation.count({ where });
  };
}
