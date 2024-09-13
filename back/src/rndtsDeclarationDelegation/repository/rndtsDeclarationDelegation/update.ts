import { Prisma, RndtsDeclarationDelegation } from "@prisma/client";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";

export type UpdateRndtsDeclarationDelegationFn = (
  where: Prisma.RndtsDeclarationDelegationWhereUniqueInput,
  data: Prisma.RndtsDeclarationDelegationUpdateInput,
  logMetadata?: LogMetadata
) => Promise<RndtsDeclarationDelegation>;

export const buildUpdateRndtsDeclarationDelegation = (
  deps: RepositoryFnDeps
): UpdateRndtsDeclarationDelegationFn => {
  return async (where, data) => {
    const { prisma } = deps;

    const delegation = await prisma.rndtsDeclarationDelegation.update({
      where,
      data
    });

    return delegation;
  };
};
