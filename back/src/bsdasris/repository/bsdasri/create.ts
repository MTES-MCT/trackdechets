import { Bsdasri, Prisma, BsdasriType } from "@prisma/client";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";
import { enqueueCreatedBsdToIndex } from "../../../queue/producers/elastic";
import { bsdasriEventTypes } from "./eventTypes";
import { getCanAccessDraftOrgIds } from "../../utils";

export type CreateBsdasriFn = (
  data: Prisma.BsdasriCreateInput,
  logMetadata?: LogMetadata
) => Promise<Bsdasri>;

export function buildCreateBsdasri(deps: RepositoryFnDeps): CreateBsdasriFn {
  return async (data, logMetadata?) => {
    const { prisma, user } = deps;

    const bsdasri = await prisma.bsdasri.create({
      data,
      include: { synthesizing: true, grouping: true, intermediaries: true }
    });
    // denormalize synthesis emitter sirets
    let synthesisEmitterSirets: string[] = [];
    if (bsdasri.type === BsdasriType.SYNTHESIS) {
      synthesisEmitterSirets = [
        ...new Set(
          bsdasri.synthesizing.map(associated => associated.emitterCompanySiret)
        )
      ].filter(Boolean);
    }

    // denormalize grouped emitter sirets
    let groupingEmitterSirets: string[] = [];
    if (bsdasri.type === BsdasriType.GROUPING) {
      groupingEmitterSirets = [
        ...new Set(bsdasri.grouping.map(grouped => grouped.emitterCompanySiret))
      ].filter(Boolean);
    }

    // For drafts, only the owner's sirets that appear on the bsd have access
    let canAccessDraftOrgIds: string[] = [];
    if (bsdasri.isDraft) {
      canAccessDraftOrgIds = await getCanAccessDraftOrgIds(bsdasri, user.id);
    }

    const updatedBsdasri = await prisma.bsdasri.update({
      where: { id: bsdasri.id },
      data: {
        ...(canAccessDraftOrgIds.length ? { canAccessDraftOrgIds } : {}),
        ...(bsdasri.type === BsdasriType.SYNTHESIS
          ? { synthesisEmitterSirets }
          : {}),
        ...(bsdasri.type === BsdasriType.GROUPING
          ? { groupingEmitterSirets }
          : {})
      }
    });

    await prisma.event.create({
      data: {
        streamId: bsdasri.id,
        actor: user.id,
        type: bsdasriEventTypes.created,
        data: data as Prisma.InputJsonObject,
        metadata: { ...logMetadata, authType: user.auth }
      }
    });
    prisma.addAfterCommitCallback(() => enqueueCreatedBsdToIndex(bsdasri.id));

    return updatedBsdasri;
  };
}
