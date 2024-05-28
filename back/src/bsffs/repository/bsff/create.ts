import { Prisma } from "@prisma/client";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";
import { enqueueCreatedBsdToIndex } from "../../../queue/producers/elastic";
import { bsffEventTypes } from "../types";
import { getTransporters } from "../../database";

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

    if (args.data.transporters) {
      const transporters = await getTransporters(bsff);
      // compute transporterOrgIds
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

    prisma.addAfterCommitCallback(() => enqueueCreatedBsdToIndex(bsff.id));

    return bsff as Prisma.BsffGetPayload<Args>;
  };
}
