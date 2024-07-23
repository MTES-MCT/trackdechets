import { Prisma } from "@prisma/client";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";
import { enqueueUpdatedBsdToIndex } from "../../../queue/producers/elastic";
import { bspaohEventTypes } from "./eventTypes";
import { PrismaBspaohWithTransporters } from "../../types";
import { getDenormalizedSirets } from "./denormalizeHelpers";
import { objectDiff } from "../../../forms/workflow/diff";

export type UpdateBspaohFn = (
  where: Prisma.BspaohWhereUniqueInput,
  data: Prisma.XOR<Prisma.BspaohUpdateInput, Prisma.BspaohUncheckedUpdateInput>,
  logMetadata?: LogMetadata
) => Promise<PrismaBspaohWithTransporters>;

export function buildUpdateBspaoh(deps: RepositoryFnDeps): UpdateBspaohFn {
  return async (where, data, logMetadata?) => {
    const { prisma, user } = deps;
    const previousPaoh = await prisma.bspaoh.findUniqueOrThrow({
      where,
      include: {
        transporters: true
      }
    });
    const updated = await prisma.bspaoh.update({
      where,
      data,
      include: {
        transporters: true
      }
    });

    // denormalize sirets
    const { transportersSirets, canAccessDraftSirets } =
      await getDenormalizedSirets(updated, user);

    const bspaoh = await prisma.bspaoh.update({
      where: { id: updated.id },
      data: {
        transportersSirets,
        canAccessDraftSirets
      },
      include: { transporters: true }
    });

    const updateDiff = objectDiff(previousPaoh, updated);
    await prisma.event.create({
      data: {
        streamId: bspaoh.id,
        actor: user.id,
        type: data.status ? bspaohEventTypes.signed : bspaohEventTypes.updated,
        data: updateDiff,
        metadata: { ...logMetadata, authType: user.auth }
      }
    });

    prisma.addAfterCommitCallback(() => enqueueUpdatedBsdToIndex(bspaoh.id));

    return bspaoh;
  };
}
