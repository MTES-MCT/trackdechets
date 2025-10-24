import { Prisma } from "@td/prisma";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";
import { enqueueUpdatedBsdToIndex } from "../../../queue/producers/elastic";
import { bsffEventTypes } from "../types";
import { objectDiff } from "../../../forms/workflow/diff";
import {
  updateDetenteurCompanySirets,
  updateTransporterOrgIds
} from "../../database";
import { getCanAccessDraftOrgIds } from "../../utils";

export type UpdateBsffFn = <Args extends Prisma.BsffUpdateArgs>(
  args: Args,
  logMetadata?: LogMetadata
) => Promise<Prisma.BsffGetPayload<Args>>;

export function buildUpdateBsff(deps: RepositoryFnDeps): UpdateBsffFn {
  return async <Args extends Prisma.BsffUpdateArgs>(
    args: Args,
    logMetadata?: LogMetadata
  ) => {
    const { prisma, user } = deps;

    const previousBsff = await prisma.bsff.findUniqueOrThrow({
      where: args.where,
      include: { transporters: true }
    });
    const updatedBsff = await prisma.bsff.update(args);

    const fullBsff = await prisma.bsff.findUniqueOrThrow({
      where: { id: updatedBsff.id },
      include: { transporters: true, ficheInterventions: true }
    });

    // update transporters ordering when connecting transporters records
    if (
      args.data.transporters?.connect &&
      Array.isArray(args.data.transporters.connect)
    ) {
      await Promise.all(
        args.data.transporters?.connect.map(({ id: transporterId }, idx) =>
          prisma.bsffTransporter.update({
            where: { id: transporterId },
            data: {
              number: idx + 1
            }
          })
        )
      );
    }

    // If a transporter is deleted, make sure to decrement the number of transporters after him.
    // This code should normally only be called from the `updateBsff` mutation when { transporter: null }
    // is passed in the UpdateBsff input or from the deleteBffTransporter mutation.
    if (args.data.transporters?.delete && fullBsff.transporters?.length) {
      if (Array.isArray(args.data.transporters.delete)) {
        // this case should never happen, throw a custom error to debug in Sentry if it ever does
        throw new Error(
          "Impossible de supprimer plusieurs transporteurs à la fois sur un bordereau"
        );
      } else {
        const deletedTransporterId = args.data.transporters.delete.id;
        if (deletedTransporterId) {
          const deletedTransporter = previousBsff.transporters.find(
            t => t.id === deletedTransporterId
          )!;
          const transporterIdsToDecrement = fullBsff.transporters
            .filter(t => t.number > deletedTransporter.number)
            .map(t => t.id);
          await prisma.bsffTransporter.updateMany({
            where: { id: { in: transporterIdsToDecrement } },
            data: { number: { decrement: 1 } }
          });
        }
      }
    }

    if (args.data.transporters) {
      await updateTransporterOrgIds(fullBsff, prisma);
    }

    if (args.data.ficheInterventions) {
      await updateDetenteurCompanySirets(fullBsff, prisma);
    }

    const { updatedAt, ...updateDiff } = objectDiff(previousBsff, updatedBsff);

    await prisma.event.create({
      data: {
        streamId: updatedBsff.id,
        actor: user.id,
        type: args.data?.status
          ? bsffEventTypes.signed
          : bsffEventTypes.updated,
        data: updateDiff,
        metadata: { ...logMetadata, authType: user.auth }
      }
    });

    if (updatedBsff.isDraft) {
      // store orgIds allowed to access drafts bsff
      const canAccessDraftOrgIds = await getCanAccessDraftOrgIds(
        fullBsff,
        user.id
      );
      if (previousBsff.canAccessDraftOrgIds) {
        await prisma.bsff.update({
          where: { id: updatedBsff.id },
          data: {
            ...(canAccessDraftOrgIds.length ? { canAccessDraftOrgIds } : {})
          }
        });
      }
    }

    prisma.addAfterCommitCallback(() =>
      enqueueUpdatedBsdToIndex(updatedBsff.id)
    );

    return updatedBsff as Prisma.BsffGetPayload<Args>;
  };
}
