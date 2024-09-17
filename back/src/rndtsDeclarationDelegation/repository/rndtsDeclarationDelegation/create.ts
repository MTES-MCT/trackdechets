import { Prisma, RndtsDeclarationDelegation } from "@prisma/client";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";

export type CreateRndtsDeclarationDelegationFn = (
  data: Prisma.RndtsDeclarationDelegationCreateInput,
  logMetadata?: LogMetadata
) => Promise<RndtsDeclarationDelegation>;

export const buildCreateRndtsDeclarationDelegation = (
  deps: RepositoryFnDeps
): CreateRndtsDeclarationDelegationFn => {
  return async data => {
    const { prisma } = deps;

    const delegation = await prisma.rndtsDeclarationDelegation.create({
      data
    });

    return delegation;
  };
};
