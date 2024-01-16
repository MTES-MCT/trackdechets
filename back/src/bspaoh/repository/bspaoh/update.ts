import { Prisma } from "@prisma/client";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";
import { enqueueUpdatedBsdToIndex } from "../../../queue/producers/elastic";
import { bspaohEventTypes } from "./eventTypes";
import { PrismaBspaohWithTransporters } from "../../types";
import { getDenormalizedSirets } from "./denormalizeHelpers";

export type UpdateBspaohFn = (
  where: Prisma.BspaohWhereUniqueInput,
  data: Prisma.XOR<Prisma.BspaohUpdateInput, Prisma.BspaohUncheckedUpdateInput>,
  logMetadata?: LogMetadata
) => Promise<PrismaBspaohWithTransporters>;

export function buildUpdateBspaoh(deps: RepositoryFnDeps): UpdateBspaohFn {
  return async (where, data, logMetadata?) => {
    const { prisma, user } = deps;
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

    await prisma.event.create({
      data: {
        streamId: bspaoh.id,
        actor: user.id,
        type: bspaohEventTypes.updated,
        data: data as Prisma.InputJsonObject,
        metadata: { ...logMetadata, authType: user.auth }
      }
    });

    // Status updates are done only through signature
    if (data.status) {
      await prisma.event.create({
        data: {
          streamId: bspaoh.id,
          actor: user.id,
          type: bspaohEventTypes.signed,
          data: { status: data.status },
          metadata: { ...logMetadata, authType: user.auth }
        }
      });
    }

    prisma.addAfterCommitCallback(() => enqueueUpdatedBsdToIndex(bspaoh.id));

    return bspaoh;
  };
}
