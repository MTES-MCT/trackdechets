import { Prisma, RegistryDelegation } from "@prisma/client";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";

export type CreateRegistryDelegationFn = (
  data: Prisma.RegistryDelegationCreateInput,
  logMetadata?: LogMetadata
) => Promise<RegistryDelegation>;

export const buildCreateRegistryDelegation = (
  deps: RepositoryFnDeps
): CreateRegistryDelegationFn => {
  return async data => {
    const { prisma } = deps;

    const delegation = await prisma.registryDelegation.create({
      data
    });

    return delegation;
  };
};
