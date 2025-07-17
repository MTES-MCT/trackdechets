import { Prisma } from "@prisma/client";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";
import { enqueueCreatedBsdToIndex } from "../../../queue/producers/elastic";
import { bsffEventTypes } from "../types";
import {
  addBsffPackagingsFichesIntervention,
  updateDetenteurCompanySirets,
  updateTransporterOrgIds
} from "../../database";
import { getCanAccessDraftOrgIds } from "../../utils";

export type CreateBsffFn = <Args extends Prisma.BsffCreateArgs>(
  args: Args,
  logMetadata?: LogMetadata
) => Promise<Prisma.BsffGetPayload<Args>>;

export function buildCreateBsff(deps: RepositoryFnDeps): CreateBsffFn {
  return async <Args extends Prisma.BsffCreateArgs>(
    args: Args,
    logMetadata?: LogMetadata
  ) => {
    const { prisma, user } = deps;

    const bsff = await prisma.bsff.create(args);

    const fullBsff = await prisma.bsff.findUniqueOrThrow({
      where: { id: bsff.id },
      include: {
        transporters: true,
        ficheInterventions: true,
        packagings: true
      }
    });

    if (args.data.transporters) {
      await updateTransporterOrgIds(fullBsff, prisma);
    }

    if (args.data.ficheInterventions) {
      await updateDetenteurCompanySirets(fullBsff, prisma);
    }

    // Si le BSFF a des fiches d'intervention et des packagings,
    // on fait le lien entre eux
    if (fullBsff.ficheInterventions?.length && fullBsff.packagings?.length) {
      await addBsffPackagingsFichesIntervention(
        fullBsff.packagings,
        fullBsff.ficheInterventions,
        prisma
      );
    }

    // update transporters ordering when connecting transporters records
    if (
      args.data.transporters?.connect &&
      Array.isArray(args.data.transporters.connect)
    ) {
      await Promise.all(
        args.data.transporters.connect.map(({ id: transporterId }, idx) =>
          prisma.bsffTransporter.update({
            where: { id: transporterId },
            data: {
              number: idx + 1
            }
          })
        )
      );
    }

    await prisma.event.create({
      data: {
        streamId: bsff.id,
        actor: user.id,
        type: bsffEventTypes.created,
        data: args.data as Prisma.InputJsonObject,
        metadata: { ...logMetadata, authType: user.auth }
      }
    });

    if (bsff.isDraft) {
      // store orgIds allowed to access drafts bsff
      const canAccessDraftOrgIds = await getCanAccessDraftOrgIds(
        fullBsff,
        user.id
      );

      await prisma.bsff.update({
        where: { id: bsff.id },
        data: {
          ...(canAccessDraftOrgIds.length ? { canAccessDraftOrgIds } : {})
        }
      });
    }
    prisma.addAfterCommitCallback(() => enqueueCreatedBsdToIndex(bsff.id));

    return bsff as Prisma.BsffGetPayload<Args>;
  };
}
