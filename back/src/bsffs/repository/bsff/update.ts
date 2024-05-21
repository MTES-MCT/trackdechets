import { Prisma } from "@prisma/client";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";
import { enqueueUpdatedBsdToIndex } from "../../../queue/producers/elastic";
import { bsffEventTypes } from "../types";
import { objectDiff } from "../../../forms/workflow/diff";
import { getTransporters } from "../../database";

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
    const bsff = await prisma.bsff.update(args);

    const { updatedAt, ...updateDiff } = objectDiff(previousBsff, bsff);
    await prisma.event.create({
      data: {
        streamId: bsff.id,
        actor: user.id,
        type: args.data?.status
          ? bsffEventTypes.signed
          : bsffEventTypes.updated,
        data: updateDiff,
        metadata: { ...logMetadata, authType: user.auth }
      }
    });

    if (args.data.transporters) {
      const transporters = await getTransporters(bsff);
      // re-compute transporterOrgIds
      await prisma.bsff.update({
        where: { id: bsff.id },
        data: {
          transportersOrgIds: transporters
            .flatMap(t => [
              t.transporterCompanySiret,
              t.transporterCompanyVatNumber
            ])
            .filter(Boolean)
        }
      });
    }

    prisma.addAfterCommitCallback(() => enqueueUpdatedBsdToIndex(bsff.id));

    return bsff as Prisma.BsffGetPayload<Args>;
  };
}
