import { Bsvhu, Prisma } from "@prisma/client";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";
import { enqueueCreatedBsdToIndex } from "../../../queue/producers/elastic";
import { bsvhuEventTypes } from "./eventTypes";
import { getUserCompanies } from "../../../users/database";
export type CreateBsvhuFn = (
  data: Prisma.BsvhuCreateInput,
  logMetadata?: LogMetadata
) => Promise<Bsvhu>;

export function buildCreateBsvhu(deps: RepositoryFnDeps): CreateBsvhuFn {
  return async (data, logMetadata?) => {
    const { prisma, user } = deps;

    const bsvhu = await prisma.bsvhu.create({
      data,
      include: {
        intermediaries: true
      }
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

    const intermediariesOrgIds: string[] = bsvhu.intermediaries
      ? bsvhu.intermediaries
          .flatMap(intermediary => [intermediary.siret, intermediary.vatNumber])
          .filter(Boolean)
      : [];

    // For drafts, only the owner's sirets that appear on the bsd have access
    const canAccessDraftOrgIds: string[] = [];
    if (bsvhu.isDraft) {
      const userCompanies = await getUserCompanies(user.id);
      const userOrgIds = userCompanies.map(company => company.orgId);
      const bsvhuOrgIds = [
        ...intermediariesOrgIds,
        bsvhu.emitterCompanySiret,
        ...[
          bsvhu.transporterCompanySiret,
          bsvhu.transporterCompanyVatNumber
        ].filter(Boolean),
        bsvhu.ecoOrganismeSiret,
        bsvhu.destinationCompanySiret,
        bsvhu.traderCompanySiret,
        bsvhu.brokerCompanySiret
      ].filter(Boolean);
      const userOrgIdsInForm = userOrgIds.filter(orgId =>
        bsvhuOrgIds.includes(orgId)
      );
      canAccessDraftOrgIds.push(...userOrgIdsInForm);
    }

    const updatedBsvhu = await prisma.bsvhu.update({
      where: { id: bsvhu.id },
      data: {
        ...(canAccessDraftOrgIds.length ? { canAccessDraftOrgIds } : {})
      },
      include: {
        intermediaries: true
      }
    });

    prisma.addAfterCommitCallback(() =>
      enqueueCreatedBsdToIndex(updatedBsvhu.id)
    );

    return updatedBsvhu;
  };
}
