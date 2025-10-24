import { Prisma, RegistryDelegation } from "@td/prisma";
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
  return async (data, logMetadata?) => {
    const { prisma, user } = deps;

    const delegation = await prisma.registryDelegation.create({
      data
    });

    await prisma.event.create({
      data: {
        streamId: delegation.id,
        actor: user.id,
        type: "RegistryDelegationCreated",
        data: { content: data } as Prisma.InputJsonObject,
        metadata: { ...logMetadata, authType: user.auth }
      }
    });

    return delegation;
  };
};
