import { BsffFicheIntervention, Prisma } from "@prisma/client";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";
import { bsffEventTypes } from "../types";

export type UpdateBsffFicheInterventionFn = (
  args: Prisma.BsffFicheInterventionUpdateArgs,
  logMetadata?: LogMetadata
) => Promise<BsffFicheIntervention>;

export function buildUpdateBsffFicheIntervention(
  deps: RepositoryFnDeps
): UpdateBsffFicheInterventionFn {
  return async (args, logMetadata?) => {
    const { prisma, user } = deps;

    const FI = await prisma.bsffFicheIntervention.update(args);

    await prisma.event.create({
      data: {
        streamId: FI.id,
        actor: user.id,
        type: bsffEventTypes.updated,
        data: args.data as Prisma.InputJsonObject,
        metadata: { ...logMetadata, authType: user.auth }
      }
    });

    return FI;
  };
}
