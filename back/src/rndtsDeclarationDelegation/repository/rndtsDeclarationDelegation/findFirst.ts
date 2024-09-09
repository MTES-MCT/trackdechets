import { Prisma, RndtsDeclarationDelegation } from "@prisma/client";
import { ReadRepositoryFnDeps } from "../../../common/repository/types";

export type FindFirstRndtsDeclarationDelegationFn = (
  where: Prisma.RndtsDeclarationDelegationWhereInput,
  options?: Omit<Prisma.RndtsDeclarationDelegationFindFirstArgs, "where">
) => Promise<RndtsDeclarationDelegation | null>;

const buildFindFirstRndtsDeclarationDelegation: (
  deps: ReadRepositoryFnDeps
) => FindFirstRndtsDeclarationDelegationFn =
  ({ prisma }) =>
  (where, options?) => {
    const input = { where, ...options };
    return prisma.rndtsDeclarationDelegation.findFirst(input);
  };

export default buildFindFirstRndtsDeclarationDelegation;
