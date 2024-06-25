import { Prisma } from "@prisma/client";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";
import { enqueueCreatedBsdToIndex } from "../../../queue/producers/elastic";
import { bsffEventTypes } from "../types";
import {
  updateDetenteurCompanySirets,
  updateTransporterOrgIds
} from "../../database";

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

    await prisma.event.create({
      data: {
        streamId: bsff.id,
        actor: user.id,
        type: bsffEventTypes.created,
        data: args.data as Prisma.InputJsonObject,
        metadata: { ...logMetadata, authType: user.auth }
      }
    });

    const fullBsff = await prisma.bsff.findUniqueOrThrow({
      where: { id: bsff.id },
      include: { transporters: true, ficheInterventions: true }
    });

    if (args.data.transporters) {
      await updateTransporterOrgIds(fullBsff, prisma);
    }

    if (args.data.ficheInterventions) {
      await updateDetenteurCompanySirets(fullBsff, prisma);
    }

    prisma.addAfterCommitCallback(() => enqueueCreatedBsdToIndex(bsff.id));

    return bsff as Prisma.BsffGetPayload<Args>;
  };
}
