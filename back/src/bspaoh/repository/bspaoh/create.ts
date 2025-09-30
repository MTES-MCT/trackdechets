import { Prisma } from "@td/prisma";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";
import { enqueueCreatedBsdToIndex } from "../../../queue/producers/elastic";
import { bspaohEventTypes } from "./eventTypes";
import { PrismaBspaohWithTransporters } from "../../types";
import { getDenormalizedSirets } from "./denormalizeHelpers";

export type CreateBspaohFn = (
  data: Prisma.BspaohCreateInput,
  logMetadata?: LogMetadata
) => Promise<PrismaBspaohWithTransporters>;

export function buildCreateBspaoh(deps: RepositoryFnDeps): CreateBspaohFn {
  return async (data, logMetadata?) => {
    const { prisma, user } = deps;

    const created = await prisma.bspaoh.create({
      data,
      include: { transporters: true }
    });

    // denormalize sirets
    const { transportersSirets, canAccessDraftSirets } =
      await getDenormalizedSirets(created, user);

    const bspaoh = await prisma.bspaoh.update({
      where: { id: created.id },
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
        type: bspaohEventTypes.created,
        data: data as Prisma.InputJsonObject,
        metadata: { ...logMetadata, authType: user.auth }
      }
    });

    prisma.addAfterCommitCallback(() => enqueueCreatedBsdToIndex(bspaoh.id));

    return bspaoh;
  };
}
