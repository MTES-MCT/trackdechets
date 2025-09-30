import { Prisma } from "@td/prisma";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";
import { enqueueCreatedBsdToIndex } from "../../../queue/producers/elastic";
import { bsvhuEventTypes } from "./eventTypes";
import { getCanAccessDraftOrgIds } from "../../utils";
import {
  BsvhuForParsingInclude,
  PrismaBsvhuForParsing
} from "../../validation/types";

export type CreateBsvhuFn = (
  data: Prisma.BsvhuCreateInput,
  logMetadata?: LogMetadata
) => Promise<PrismaBsvhuForParsing>;

export function buildCreateBsvhu(deps: RepositoryFnDeps): CreateBsvhuFn {
  return async (data, logMetadata?) => {
    const { prisma, user } = deps;

    const bsvhu = await prisma.bsvhu.create({
      data,
      include: BsvhuForParsingInclude
    });

    await prisma.event.create({
      data: {
        streamId: bsvhu.id,
        actor: user.id,
        type: bsvhuEventTypes.created,
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
          prisma.bsvhuTransporter.update({
            where: { id: transporterId },
            data: {
              number: idx + 1
            }
          })
        )
      );
    }

    const transportersOrgIds: string[] = bsvhu.transporters
      ? bsvhu.transporters
          .flatMap(t => [
            t.transporterCompanySiret,
            t.transporterCompanyVatNumber
          ])
          .filter(Boolean)
      : [];

    // For drafts, only the owner's sirets that appear on the bsd have access
    const canAccessDraftOrgIds = await getCanAccessDraftOrgIds(bsvhu, user.id);

    await prisma.bsvhu.update({
      where: { id: bsvhu.id },
      data: {
        ...(canAccessDraftOrgIds.length ? { canAccessDraftOrgIds } : {}),
        ...(transportersOrgIds.length ? { transportersOrgIds } : {})
      },
      select: {
        id: true
      }
    });

    prisma.addAfterCommitCallback(() => enqueueCreatedBsdToIndex(bsvhu.id));

    return bsvhu;
  };
}
