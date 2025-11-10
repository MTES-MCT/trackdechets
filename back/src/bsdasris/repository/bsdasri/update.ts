import { Bsdasri, Prisma } from "@td/prisma";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";
import { enqueueUpdatedBsdToIndex } from "../../../queue/producers/elastic";
import { bsdasriEventTypes } from "./eventTypes";
import { objectDiff } from "../../../forms/workflow/diff";
import { getCanAccessDraftOrgIds } from "../../utils";

export type UpdateBsdasriFn = (
  where: Prisma.BsdasriWhereUniqueInput,
  data: Prisma.XOR<
    Prisma.BsdasriUpdateInput,
    Prisma.BsdasriUncheckedUpdateInput
  >,
  logMetadata?: LogMetadata
) => Promise<Bsdasri>;

export function buildUpdateBsdasri(deps: RepositoryFnDeps): UpdateBsdasriFn {
  return async (where, data, logMetadata?) => {
    const { prisma, user } = deps;
    const previousBsdasri = await prisma.bsdasri.findUniqueOrThrow({
      where,
      include: {
        synthesizing: true,
        grouping: true
      }
    });

    const bsdasri = await prisma.bsdasri.update({
      where,
      data,
      include: {
        synthesizing: !!data?.synthesizing,
        grouping: !!data?.grouping
      }
    });
    // denormalize synthesis emitter sirets
    if (!!data?.synthesizing) {
      const synthesisEmitterSirets = [
        ...new Set(
          bsdasri.synthesizing.map(associated => associated.emitterCompanySiret)
        )
      ].filter(Boolean);

      await prisma.bsdasri.update({
        where: { id: bsdasri.id },
        data: { synthesisEmitterSirets }
      });
    }

    // denormalize grouping emitter sirets
    if (!!data?.grouping) {
      const groupingEmitterSirets = [
        ...new Set(bsdasri.grouping.map(grouped => grouped.emitterCompanySiret))
      ].filter(Boolean);
      await prisma.bsdasri.update({
        where: { id: bsdasri.id },
        data: { groupingEmitterSirets }
      });
    }

    if (bsdasri.isDraft) {
      const canAccessDraftOrgIds = await getCanAccessDraftOrgIds(
        bsdasri,
        user.id
      );
      await prisma.bsdasri.update({
        where: { id: bsdasri.id },
        data: {
          canAccessDraftOrgIds
        },
        select: {
          id: true
        }
      });
    }

    const { updatedAt, ...updateDiff } = objectDiff(previousBsdasri, bsdasri);
    await prisma.event.create({
      data: {
        streamId: bsdasri.id,
        actor: user.id,
        type: data.status
          ? bsdasriEventTypes.signed
          : bsdasriEventTypes.updated,
        data: updateDiff,
        metadata: { ...logMetadata, authType: user.auth }
      }
    });

    prisma.addAfterCommitCallback(() => enqueueUpdatedBsdToIndex(bsdasri.id));

    return bsdasri;
  };
}
