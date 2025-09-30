import { BsffFicheIntervention, Prisma } from "@td/prisma";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";
import { bsffEventTypes } from "../types";

export type CreateBsffFicheInterventionFn = (
  args: Prisma.BsffFicheInterventionCreateArgs,
  logMetadata?: LogMetadata
) => Promise<BsffFicheIntervention>;

export function buildCreateBsffFicheIntervention(
  deps: RepositoryFnDeps
): CreateBsffFicheInterventionFn {
  return async (args, logMetadata?) => {
    const { prisma, user } = deps;

    const FI = await prisma.bsffFicheIntervention.create(args);

    await prisma.event.create({
      data: {
        streamId: FI.id,
        actor: user.id,
        type: bsffEventTypes.created,
        data: args.data as Prisma.InputJsonObject,
        metadata: { ...logMetadata, authType: user.auth }
      }
    });

    return FI;
  };
}
