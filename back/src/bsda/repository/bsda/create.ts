import { Bsda, Prisma } from "@prisma/client";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";
import { enqueueCreatedBsdToIndex } from "../../../queue/producers/elastic";
import { bsdaEventTypes } from "./eventTypes";

export type CreateBsdaFn = (
  data: Prisma.BsdaCreateInput,
  logMetadata?: LogMetadata
) => Promise<Bsda>;

export function buildCreateBsda(deps: RepositoryFnDeps): CreateBsdaFn {
  return async (data, logMetadata?) => {
    const { prisma, user } = deps;

    const bsda = await prisma.bsda.create({
      data,
      include: {
        grouping: { select: { id: true } }
      }
    });

    await prisma.event.create({
      data: {
        streamId: bsda.id,
        actor: user.id,
        type: bsdaEventTypes.created,
        data: data as Prisma.InputJsonObject,
        metadata: { ...logMetadata, authType: user.auth }
      }
    });

    prisma.addAfterCommitCallback(() => enqueueCreatedBsdToIndex(bsda.id));

    // Une optimisation est en place sur le calcul des champs
    // `Bsda.forwardedIn` et `Bsda.groupedIn` dans la query `bsds`
    // permettant d'utiliser les valeurs de `forwardedIn` et `groupedIn`
    // stockés dans ES. Afin que ES reste synchronisé en cas d'update sur le BSDA
    // de regroupement ou de réexpedition, on est obligé de
    // réindexer les bordereaux initiaux.

    if (bsda.grouping.length > 0) {
      for (const { id } of bsda.grouping) {
        prisma.addAfterCommitCallback(() => enqueueCreatedBsdToIndex(id));
      }
    }

    if (bsda.forwardingId) {
      prisma.addAfterCommitCallback(() =>
        enqueueCreatedBsdToIndex(bsda.forwardingId!)
      );
    }

    return bsda;
  };
}
