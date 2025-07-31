import { DASRI_WASTE_CODES_MAPPING } from "@td/constants";
import { getUserCompanies } from "../users/database";
import { Bsdasri } from "@prisma/client";

export function getWasteDescription(wasteCode: string) {
  return DASRI_WASTE_CODES_MAPPING[wasteCode] ?? "";
}

export const getCanAccessDraftOrgIds = async (
  bsdasri: Bsdasri,
  userId: string
): Promise<string[]> => {
  const canAccessDraftOrgIds: string[] = [];
  if (bsdasri.isDraft) {
    const userCompanies = await getUserCompanies(userId);
    const userOrgIds = userCompanies.map(company => company.orgId);
    const bsdasriOrgIds = [
      bsdasri.emitterCompanySiret,
      ...[bsdasri.transporterCompanySiret, bsdasri.transporterCompanyVatNumber],
      bsdasri.ecoOrganismeSiret,
      bsdasri.destinationCompanySiret,
      bsdasri.traderCompanySiret,
      bsdasri.brokerCompanySiret
    ].filter(Boolean);
    const userOrgIdsInForm = userOrgIds.filter(orgId =>
      bsdasriOrgIds.includes(orgId)
    );
    canAccessDraftOrgIds.push(...userOrgIdsInForm);
  }

  return canAccessDraftOrgIds;
};
