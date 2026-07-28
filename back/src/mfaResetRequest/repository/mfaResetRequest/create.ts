import { Prisma, MfaResetRequest } from "@td/prisma";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";

export type CreateMfaResetRequestFn = (
  data: Prisma.MfaResetRequestCreateInput,
  logMetadata?: LogMetadata
) => Promise<MfaResetRequest>;

export const buildCreateMfaResetRequest = (
  deps: RepositoryFnDeps
): CreateMfaResetRequestFn => {
  return async (data, logMetadata?) => {
    const { prisma, user } = deps;

    const mfaResetRequest = await prisma.mfaResetRequest.create({ data });

    await prisma.event.create({
      data: {
        streamId: mfaResetRequest.id,
        actor: user.id,
        type: "MfaResetRequestCreated",
        data: { content: data } as Prisma.InputJsonObject,
        metadata: { ...logMetadata, authType: user.auth }
      }
    });

    return mfaResetRequest;
  };
};
