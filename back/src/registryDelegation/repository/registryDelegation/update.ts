import { Prisma, RegistryDelegation } from "@prisma/client";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";

export type UpdateRegistryDelegationFn = (
  where: Prisma.RegistryDelegationWhereUniqueInput,
  data: Prisma.RegistryDelegationUpdateInput,
  logMetadata?: LogMetadata
) => Promise<RegistryDelegation>;

export const buildUpdateRegistryDelegation = (
  deps: RepositoryFnDeps
): UpdateRegistryDelegationFn => {
  return async (where, data) => {
    const { prisma } = deps;

    const delegation = await prisma.registryDelegation.update({
      where,
      data
    });

    return delegation;
  };
};
