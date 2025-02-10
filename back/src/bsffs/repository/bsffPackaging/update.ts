import { BsffPackaging, Prisma } from "@prisma/client";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";
import { bsffEventTypes } from "../types";
import { objectDiff } from "../../../forms/workflow/diff";
import { getStatus } from "../../compat";
import { buildUpdateBsff } from "../bsff/update";

export type UpdateBsffPackagingFn = (
  args: Prisma.BsffPackagingUpdateArgs,
  logMetadata?: LogMetadata
) => Promise<BsffPackaging>;

export function buildUpdateBsffPackaging(
  deps: RepositoryFnDeps
): UpdateBsffPackagingFn {
  return async (args, logMetadata?) => {
    const { prisma, user } = deps;

    const previousBsffPackaging = await prisma.bsffPackaging.findUnique({
      where: args.where
    });
    const bsffPackaging = await prisma.bsffPackaging.update(args);

    const updateDiff = objectDiff(previousBsffPackaging, bsffPackaging);
    await prisma.event.create({
      data: {
        streamId: bsffPackaging.bsffId,
        actor: user.id,
        type: bsffEventTypes.updated,
        data: updateDiff,
        metadata: {
          ...logMetadata,
          authType: user.auth,
          packagingId: bsffPackaging.id
        }
      }
    });

    if (
      // Il s'agit d'un changement sur le code de traitement du contenant
      // qui est effectuée suite à la signature de l'opération via une correction.
      // Nous devons donc recalculer le statut du BSFF au cas où l'on ait un
      // changement Processed -> IntermediatelyProcessed
      // ou IntermediatelyProcessed -> Processed
      (bsffPackaging.operationSignatureDate && args.data.operationCode) ||
      // Il s'agit d'une correction du statut d'acceptation qui est effectuée suite
      // à la signature du refus. Nous devons donc recalculer le statut du BSFF au
      // cas où il y ait un changement Refused => Accepted, Refused => PartiallyRefused
      (bsffPackaging.acceptationSignatureDate && args.data.acceptationStatus)
    ) {
      const bsff = await prisma.bsff.findUniqueOrThrow({
        where: { id: bsffPackaging.bsffId },
        include: { packagings: true }
      });

      const status = await getStatus(bsff, {
        user,
        prisma
      });

      const updateBsff = buildUpdateBsff(deps);

      await updateBsff({
        where: { id: bsff.id },
        data: { status }
      });
    }

    return bsffPackaging;
  };
}
