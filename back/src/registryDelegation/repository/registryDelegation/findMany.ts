import { Prisma } from "@prisma/client";
import { ReadRepositoryFnDeps } from "../../../common/repository/types";

export type FindManyRegistryDelegationFn = <
  Args extends Omit<Prisma.RegistryDelegationFindManyArgs, "where">
>(
  where: Prisma.RegistryDelegationWhereInput,
  options?: Args
) => Promise<Array<Prisma.RegistryDelegationGetPayload<Args>>>;

export function buildFindManyRegistryDelegation({
  prisma
}: ReadRepositoryFnDeps): FindManyRegistryDelegationFn {
  return async <
    Args extends Omit<Prisma.RegistryDelegationFindManyArgs, "where">
  >(
    where: Prisma.RegistryDelegationWhereInput,
    options?: Args
  ) => {
    const input = { where, ...options };
    const registryDelegations = await prisma.registryDelegation.findMany(input);
    return registryDelegations as Array<
      Prisma.RegistryDelegationGetPayload<Args>
    >;
  };
}
