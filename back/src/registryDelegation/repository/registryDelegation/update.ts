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
  return async (where, data, logMetadata) => {
    const { prisma, user } = deps;

    const delegation = await prisma.registryDelegation.update({
      where,
      data
    });

    await prisma.event.create({
      data: {
        streamId: delegation.id,
        actor: user.id,
        type: "RegistryDelegationUpdated",
        data: { content: data } as Prisma.InputJsonObject,
        metadata: { ...logMetadata, authType: user.auth }
      }
    });

    return delegation;
  };
};
