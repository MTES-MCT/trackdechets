import { Prisma } from "@prisma/client";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";
import { enqueueUpdatedBsdToIndex } from "../../../queue/producers/elastic";
import { bsvhuEventTypes } from "./eventTypes";
import { objectDiff } from "../../../forms/workflow/diff";
import { getCanAccessDraftOrgIds } from "../../utils";
import {
  BsvhuForParsingInclude,
  PrismaBsvhuForParsing
} from "../../validation/types";
import { getTransportersSync } from "../../database";

export type UpdateBsvhuFn = (
  where: Prisma.BsvhuWhereUniqueInput,
  data: Prisma.XOR<Prisma.BsvhuUpdateInput, Prisma.BsvhuUncheckedUpdateInput>,
  logMetadata?: LogMetadata
) => Promise<PrismaBsvhuForParsing>;

export function buildUpdateBsvhu(deps: RepositoryFnDeps): UpdateBsvhuFn {
  return async (where, data, logMetadata?) => {
    const { prisma, user } = deps;

    const previousBsvhu = await prisma.bsvhu.findUniqueOrThrow({
      where,
      include: BsvhuForParsingInclude
    });
    const bsvhu = await prisma.bsvhu.update({
      where,
      data,
      include: BsvhuForParsingInclude
    });
    if (bsvhu.isDraft) {
      // For drafts, only the owner's sirets that appear on the bsd have access
      const canAccessDraftOrgIds = await getCanAccessDraftOrgIds(
        bsvhu,
        user.id
      );

      await prisma.bsvhu.update({
        where: { id: bsvhu.id },
        data: {
          ...(canAccessDraftOrgIds.length ? { canAccessDraftOrgIds } : {})
        },
        select: {
          id: true
        }
      });
    }

    // update transporters ordering when connecting transporters records
    if (
      data.transporters?.connect &&
      Array.isArray(data.transporters.connect)
    ) {
      await Promise.all(
        data.transporters?.connect.map(({ id: transporterId }, idx) =>
          prisma.bsvhuTransporter.update({
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
    // is passed in the UpdateBsvhu input or from the deleteBsvhuTransporter mutation.
    if (data.transporters?.delete && bsvhu.transporters?.length) {
      if (Array.isArray(data.transporters.delete)) {
        // this case should never happen, throw a custom error to debug in Sentry if it ever does
        throw new Error(
          "Impossible de supprimer plusieurs transporteurs à la fois sur un bordereau"
        );
      } else {
        const deletedTransporterId = data.transporters.delete.id;
        if (deletedTransporterId) {
          const deletedTransporter = previousBsvhu.transporters.find(
            t => t.id === deletedTransporterId
          )!;
          const transporterIdsToDecrement = bsvhu.transporters
            .filter(t => t.number > deletedTransporter.number)
            .map(t => t.id);
          await prisma.bsvhuTransporter.updateMany({
            where: { id: { in: transporterIdsToDecrement } },
            data: { number: { decrement: 1 } }
          });
        }
      }
    }
    if (data.transporters) {
      // recompute transporterOrgIds
      await prisma.bsvhu.update({
        where: { id: bsvhu.id },
        data: {
          transportersOrgIds: getTransportersSync(bsvhu)
            .flatMap(t => [
              t.transporterCompanySiret,
              t.transporterCompanyVatNumber
            ])
            .filter(Boolean)
        }
      });
    }

    const { updatedAt, ...updateDiff } = objectDiff(previousBsvhu, bsvhu);
    await prisma.event.create({
      data: {
        streamId: bsvhu.id,
        actor: user.id,
        type: data.status ? bsvhuEventTypes.signed : bsvhuEventTypes.updated,
        data: updateDiff,
        metadata: { ...logMetadata, authType: user.auth }
      }
    });
    prisma.addAfterCommitCallback(() => enqueueUpdatedBsdToIndex(bsvhu.id));

    return bsvhu;
  };
}
