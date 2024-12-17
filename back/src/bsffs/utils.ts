import { getUserCompanies } from "../users/database";
import { BsffWithTransporters } from "./types";

export const getCanAccessDraftOrgIds = async (
  bsff: BsffWithTransporters,
  userId: string
): Promise<string[]> => {
  const canAccessDraftOrgIds: string[] = [];

  if (bsff.isDraft) {
    const userCompanies = await getUserCompanies(userId);
    const trsOrgIds = bsff.transporters.reduce(
      (acc, trs) => [
        ...acc,
        trs.transporterCompanySiret,
        trs.transporterCompanyVatNumber
      ],
      []
    );
    const userOrgIds = userCompanies.map(company => company.orgId);
    // we skip detenteurs as they do not belong to the bsff itself
    const bsffOrgIds = [
      bsff.emitterCompanySiret,
      bsff.destinationCompanySiret,
      ...trsOrgIds
    ].filter(Boolean);
    const userOrgIdsInBsd = userOrgIds.filter(orgId =>
      bsffOrgIds.includes(orgId)
    );
    canAccessDraftOrgIds.push(...userOrgIdsInBsd);
  }

  return canAccessDraftOrgIds;
};
