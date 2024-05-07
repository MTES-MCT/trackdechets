import { BsffFicheIntervention, Prisma } from "@prisma/client";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";
import { bsffEventTypes } from "../types";
import { objectDiff } from "../../../forms/workflow/diff";

export type UpdateBsffFicheInterventionFn = (
  args: Prisma.BsffFicheInterventionUpdateArgs,
  logMetadata?: LogMetadata
) => Promise<BsffFicheIntervention>;

export function buildUpdateBsffFicheIntervention(
  deps: RepositoryFnDeps
): UpdateBsffFicheInterventionFn {
  return async (args, logMetadata?) => {
    const { prisma, user } = deps;

    const previousFi = await prisma.bsffFicheIntervention.findUnique({
      where: args.where
    });
    const fi = await prisma.bsffFicheIntervention.update(args);

    const updateDiff = objectDiff(previousFi, fi);
    await prisma.event.create({
      data: {
        streamId: fi.id,
        actor: user.id,
        type: bsffEventTypes.updated,
        data: updateDiff,
        metadata: { ...logMetadata, authType: user.auth }
      }
    });

    return fi;
  };
}
