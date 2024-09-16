import { Prisma } from "@prisma/client";
import { ReadRepositoryFnDeps } from "../../../common/repository/types";

export type FindManyRndtsDeclarationDelegationFn = <
  Args extends Omit<Prisma.RndtsDeclarationDelegationFindManyArgs, "where">
>(
  where: Prisma.RndtsDeclarationDelegationWhereInput,
  options?: Args
) => Promise<Array<Prisma.RndtsDeclarationDelegationGetPayload<Args>>>;

export function buildFindManyRndtsDeclarationDelegation({
  prisma
}: ReadRepositoryFnDeps): FindManyRndtsDeclarationDelegationFn {
  return async <
    Args extends Omit<Prisma.RndtsDeclarationDelegationFindManyArgs, "where">
  >(
    where: Prisma.RndtsDeclarationDelegationWhereInput,
    options?: Args
  ) => {
    const input = { where, ...options };
    const rndtsDeclarationDelegations =
      await prisma.rndtsDeclarationDelegation.findMany(input);
    return rndtsDeclarationDelegations as Array<
      Prisma.RndtsDeclarationDelegationGetPayload<Args>
    >;
  };
}
