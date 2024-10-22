import { getUserCompanies } from "../users/database";
import { BsvhuWithIntermediaries } from "./types";

export function getWasteDescription(wasteCode: string | null) {
  return wasteCode === "16 01 06"
    ? "Véhicules hors d'usage ne contenant ni liquides ni autres composants dangereux"
    : wasteCode === "16 01 04*"
    ? "Véhicules hors d’usage non dépollués par un centre agréé"
    : "";
}

export const getCanAccessDraftOrgIds = async (
  bsvhu: BsvhuWithIntermediaries,
  userId: string
): Promise<string[]> => {
  const intermediariesOrgIds: string[] = bsvhu.intermediaries
    ? bsvhu.intermediaries
        .flatMap(intermediary => [intermediary.siret, intermediary.vatNumber])
        .filter(Boolean)
    : [];

  const canAccessDraftOrgIds: string[] = [];
  if (bsvhu.isDraft) {
    const userCompanies = await getUserCompanies(userId);
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
  return canAccessDraftOrgIds;
};
