import { Prisma } from "@prisma/client";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";
import { enqueueUpdatedBsdToIndex } from "../../../queue/producers/elastic";
import { bsdaEventTypes } from "./eventTypes";
import { BsdaWithTransporters } from "../../types";

export type UpdateBsdaFn = (
  where: Prisma.BsdaWhereUniqueInput,
  data: Prisma.XOR<Prisma.BsdaUpdateInput, Prisma.BsdaUncheckedUpdateInput>,
  logMetadata?: LogMetadata
) => Promise<BsdaWithTransporters>;

export function buildUpdateBsda(deps: RepositoryFnDeps): UpdateBsdaFn {
  return async (where, data, logMetadata?) => {
    const { prisma, user } = deps;

    // Une optimisation est en place sur le calcul des champs
    // `Bsda.forwardedIn` et `Bsda.groupedIn` dans la query `bsds`
    // permettant d'utiliser les valeurs de `forwardedIn` et `groupedIn`
    // stockés dans ES. Afin que ES reste synchronisé en cas d'update sur le BSDA
    // de regroupement ou de réexpedition, on est obligé de
    // réindexer les bordereaux initiaux.
    const previousBsdaInclude = {
      grouping: { select: { id: true } },
      forwarding: { select: { id: true } }
    };

    const { grouping, forwarding } = await prisma.bsda.findUniqueOrThrow({
      where,
      include: previousBsdaInclude
    });

    const updatedBsda = await prisma.bsda.update({
      where,
      data,
      include: { ...previousBsdaInclude, transporters: true }
    });

    await prisma.event.create({
      data: {
        streamId: updatedBsda.id,
        actor: user.id,
        type: bsdaEventTypes.updated,
        data: data as Prisma.InputJsonObject,
        metadata: { ...logMetadata, authType: user.auth }
      }
    });

    // Status updates are done only through signature
    if (data.status) {
      await prisma.event.create({
        data: {
          streamId: updatedBsda.id,
          actor: user.id,
          type: bsdaEventTypes.signed,
          data: { status: data.status },
          metadata: { ...logMetadata, authType: user.auth }
        }
      });
    }

    prisma.addAfterCommitCallback(() =>
      enqueueUpdatedBsdToIndex(updatedBsda.id)
    );

    if (data.grouping !== undefined) {
      // Identifiants des bordereaux regroupés avant l'update
      const initialGroupedIds = grouping.map(({ id }) => id);
      // Identifiants des bordereaux regroupés après l'update
      const groupedIds = updatedBsda.grouping.map(({ id }) => id);
      // Identifiants des bordereaux qui ont été enlevés du regroupement
      const removedIds = grouping
        .map(({ id }) => id)
        .filter(id => !groupedIds.includes(id));
      // Identifiants des bordereaux qui ont été ajoutés dans le regroupement
      const addedIds = updatedBsda.grouping
        .map(({ id }) => id)
        .filter(id => !initialGroupedIds.includes(id));
      // Identifiants des bordereaux qui doivent être réindexés pour que rawBsd.groupedIn
      // ne soit pas dé-synchronisé
      const dirtyIds = [...removedIds, ...addedIds];
      for (const id of dirtyIds) {
        prisma.addAfterCommitCallback(() => enqueueUpdatedBsdToIndex(id));
      }
    }

    if (forwarding?.id !== updatedBsda.forwardingId) {
      // Identifiants des bordereaux qui doivent être réindexés pour que rawBsd.forwardedIn
      // ne soit pas désynchronisé
      const dirtyIds = [forwarding?.id, updatedBsda.forwardingId].filter(
        Boolean
      );
      for (const id of dirtyIds) {
        prisma.addAfterCommitCallback(() => enqueueUpdatedBsdToIndex(id));
      }
    }

    return updatedBsda;
  };
}
