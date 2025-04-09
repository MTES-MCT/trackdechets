import { getUserCompanies } from "../users/database";
import { BsdaWithIntermediaries, BsdaWithTransporters } from "./types";

export const getCanAccessDraftOrgIds = async (
  bsda: BsdaWithIntermediaries & BsdaWithTransporters,
  userId: string
): Promise<string[]> => {
  const intermediariesOrgIds: string[] = bsda.intermediaries
    ? bsda.intermediaries
        .flatMap(intermediary => [intermediary.siret, intermediary.vatNumber])
        .filter(Boolean)
    : [];
  const transportersOrgIds: string[] = bsda.transporters
    ? bsda.transporters
        .flatMap(t => [
          t.transporterCompanySiret,
          t.transporterCompanyVatNumber
        ])
        .filter(Boolean)
    : [];
  // For drafts, only the owner's sirets that appear on the bsd have access
  const canAccessDraftOrgIds: string[] = [];
  if (bsda.isDraft) {
    const userCompanies = await getUserCompanies(userId);
    const userOrgIds = userCompanies.map(company => company.orgId);
    const bsdaOrgIds = [
      ...intermediariesOrgIds,
      ...transportersOrgIds,
      bsda.emitterCompanySiret,
      bsda.ecoOrganismeSiret,
      bsda.destinationCompanySiret,
      bsda.destinationOperationNextDestinationCompanySiret,
      bsda.workerCompanySiret,
      bsda.brokerCompanySiret
    ].filter(Boolean);
    const userOrgIdsInForm = userOrgIds.filter(orgId =>
      bsdaOrgIds.includes(orgId)
    );
    canAccessDraftOrgIds.push(...userOrgIdsInForm);
  }
  return canAccessDraftOrgIds;
};
