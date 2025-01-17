import { Prisma } from "@prisma/client";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";
import { enqueueUpdatedBsdToIndex } from "../../../queue/producers/elastic";
import { bsdaEventTypes } from "./eventTypes";
import { BsdaWithTransporters } from "../../types";
import { getTransportersSync } from "../../database";
import { objectDiff } from "../../../forms/workflow/diff";
import { lookupUtils } from "../../registryV2";

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

    const previousBsda = await prisma.bsda.findUniqueOrThrow({
      where,
      include: { ...previousBsdaInclude, transporters: true }
    });

    const updatedBsda = await prisma.bsda.update({
      where,
      data,
      include: { ...previousBsdaInclude, transporters: true }
    });

    // update transporters ordering when connecting transporters records
    if (
      data.transporters?.connect &&
      Array.isArray(data.transporters.connect)
    ) {
      await Promise.all(
        data.transporters?.connect.map(({ id: transporterId }, idx) =>
          prisma.bsdaTransporter.update({
            where: { id: transporterId },
            data: {
              number: idx + 1
            }
          })
        )
      );
    }

    // If a transporter is deleted, make sure to decrement the number of transporters after him.
    // This code should normally only be called from the `updateForm` mutation when { transporter: null }
    // is passed in the UpdateBsda input or from the deleteBsdaTransporter mutation.
    if (data.transporters?.delete && updatedBsda.transporters?.length) {
      if (Array.isArray(data.transporters.delete)) {
        // this case should never happen, throw a custom error to debug in Sentry if it ever does
        throw new Error(
          "Impossible de supprimer plusieurs transporteurs à la fois sur un bordereau"
        );
      } else {
        const deletedTransporterId = data.transporters.delete.id;
        if (deletedTransporterId) {
          const deletedTransporter = previousBsda.transporters.find(
            t => t.id === deletedTransporterId
          )!;
          const transporterIdsToDecrement = updatedBsda.transporters
            .filter(t => t.number > deletedTransporter.number)
            .map(t => t.id);
          await prisma.bsdaTransporter.updateMany({
            where: { id: { in: transporterIdsToDecrement } },
            data: { number: { decrement: 1 } }
          });
        }
      }
    }

    const { updatedAt, ...updateDiff } = objectDiff(previousBsda, updatedBsda);
    await prisma.event.create({
      data: {
        streamId: updatedBsda.id,
        actor: user.id,
        type: data.status ? bsdaEventTypes.signed : bsdaEventTypes.updated,
        data: updateDiff,
        metadata: { ...logMetadata, authType: user.auth }
      }
    });

    if (data.transporters) {
      // recompute transporterOrgIds
      await prisma.bsda.update({
        where: { id: updatedBsda.id },
        data: {
          transportersOrgIds: getTransportersSync(updatedBsda)
            .flatMap(t => [
              t.transporterCompanySiret,
              t.transporterCompanyVatNumber
            ])
            .filter(Boolean)
        }
      });
    }

    await lookupUtils.update(updatedBsda, prisma);
    prisma.addAfterCommitCallback(() =>
      enqueueUpdatedBsdToIndex(updatedBsda.id)
    );

    if (data.grouping !== undefined) {
      // Identifiants des bordereaux regroupés avant l'update
      const initialGroupedIds = previousBsda.grouping.map(({ id }) => id);
      // Identifiants des bordereaux regroupés après l'update
      const groupedIds = updatedBsda.grouping.map(({ id }) => id);
      // Identifiants des bordereaux qui ont été enlevés du regroupement
      const removedIds = previousBsda.grouping
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

    if (previousBsda.forwarding?.id !== updatedBsda.forwardingId) {
      // Identifiants des bordereaux qui doivent être réindexés pour que rawBsd.forwardedIn
      // ne soit pas désynchronisé
      const dirtyIds = [
        previousBsda.forwarding?.id,
        updatedBsda.forwardingId
      ].filter(Boolean);
      for (const id of dirtyIds) {
        prisma.addAfterCommitCallback(() => enqueueUpdatedBsdToIndex(id));
      }
    }

    return updatedBsda;
  };
}
