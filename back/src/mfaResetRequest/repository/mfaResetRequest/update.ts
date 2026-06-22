import { Prisma, MfaResetRequest } from "@td/prisma";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";

export type UpdateMfaResetRequestFn = (
  where: Prisma.MfaResetRequestWhereUniqueInput,
  data: Prisma.MfaResetRequestUpdateInput,
  logMetadata?: LogMetadata
) => Promise<MfaResetRequest>;

export const buildUpdateMfaResetRequest = (
  deps: RepositoryFnDeps
): UpdateMfaResetRequestFn => {
  return async (where, data, logMetadata?) => {
    const { prisma, user } = deps;

    const updated = await prisma.mfaResetRequest.update({ where, data });

    await prisma.event.create({
      data: {
        streamId: updated.id,
        actor: user.id,
        type: "MfaResetRequestUpdated",
        data: { content: data } as Prisma.InputJsonObject,
        metadata: { ...logMetadata, authType: user.auth }
      }
    });

    return updated;
  };
};
