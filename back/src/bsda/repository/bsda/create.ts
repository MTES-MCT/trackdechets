import { Prisma } from "@prisma/client";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";
import { enqueueCreatedBsdToIndex } from "../../../queue/producers/elastic";
import { bsdaEventTypes } from "./eventTypes";
import { BsdaWithTransporters } from "../../types";
import { getUserCompanies } from "../../../users/database";

export type CreateBsdaFn = (
  data: Prisma.BsdaCreateInput,
  logMetadata?: LogMetadata
) => Promise<BsdaWithTransporters>;

export function buildCreateBsda(deps: RepositoryFnDeps): CreateBsdaFn {
  return async (data, logMetadata?) => {
    const { prisma, user } = deps;

    const bsda = await prisma.bsda.create({
      data,
      include: {
        grouping: { select: { id: true } },
        transporters: true,
        intermediaries: true
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

    // update transporters ordering when connecting transporters records
    if (
      data.transporters?.connect &&
      Array.isArray(data.transporters.connect)
    ) {
      await Promise.all(
        data.transporters.connect.map(({ id: transporterId }, idx) =>
          prisma.bsdaTransporter.update({
            where: { id: transporterId },
            data: {
              number: idx + 1
            }
          })
        )
      );
    }
    const intermediariesOrgIds: string[] = bsda.intermediaries
      ? bsda.intermediaries
          .flatMap(intermediary => [intermediary.siret, intermediary.vatNumber])
          .filter(Boolean)
      : [];
    const transportersOrgIds: string[] = bsda.transporters
      ? bsda.transporters
          .flatMap(t => [
            t.transporterCompanySiret,
            t.transporterCompanyVatNumber
          ])
          .filter(Boolean)
      : [];
    // For drafts, only the owner's sirets that appear on the bsd have access
    const canAccessDraftOrgIds: string[] = [];
    if (bsda.isDraft) {
      const userCompanies = await getUserCompanies(user.id);
      const userOrgIds = userCompanies.map(company => company.orgId);
      const bsdaOrgIds = [
        ...intermediariesOrgIds,
        ...transportersOrgIds,
        bsda.emitterCompanySiret,
        bsda.ecoOrganismeSiret,
        bsda.destinationCompanySiret,
        bsda.destinationOperationNextDestinationCompanySiret,
        bsda.workerCompanySiret,
        bsda.brokerCompanySiret
      ].filter(Boolean);
      const userOrgIdsInForm = userOrgIds.filter(orgId =>
        bsdaOrgIds.includes(orgId)
      );
      canAccessDraftOrgIds.push(...userOrgIdsInForm);
    }

    const updatedBsda = await prisma.bsda.update({
      where: { id: bsda.id },
      data: {
        ...(canAccessDraftOrgIds.length ? { canAccessDraftOrgIds } : {}),
        ...(transportersOrgIds.length ? { transportersOrgIds } : {}),
        transportersOrgIds
      },
      include: {
        grouping: { select: { id: true } },
        transporters: true,
        intermediaries: true
      }
    });

    prisma.addAfterCommitCallback(() =>
      enqueueCreatedBsdToIndex(updatedBsda.id)
    );

    // Une optimisation est en place sur le calcul des champs
    // `Bsda.forwardedIn` et `Bsda.groupedIn` dans la query `bsds`
    // permettant d'utiliser les valeurs de `forwardedIn` et `groupedIn`
    // stockés dans ES. Afin que ES reste synchronisé en cas d'update sur le BSDA
    // de regroupement ou de réexpedition, on est obligé de
    // réindexer les bordereaux initiaux.

    if (updatedBsda.grouping.length > 0) {
      for (const { id } of updatedBsda.grouping) {
        prisma.addAfterCommitCallback(() => enqueueCreatedBsdToIndex(id));
      }
    }

    if (updatedBsda.forwardingId) {
      prisma.addAfterCommitCallback(() =>
        enqueueCreatedBsdToIndex(updatedBsda.forwardingId!)
      );
    }

    return updatedBsda;
  };
}
