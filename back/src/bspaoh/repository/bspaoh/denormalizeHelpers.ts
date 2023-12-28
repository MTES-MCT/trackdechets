import { getUserCompanies } from "../../../users/database";
import { BspaohStatus } from "@prisma/client";
import { PrismaBspaohWithTransporters } from "../../types";

export const getDenormalizedSirets = async (
  paoh: PrismaBspaohWithTransporters,
  user: Express.User
) => {
  let transportersSirets = [
    ...(paoh?.transporters ?? []).flatMap(t => [
      t.transporterCompanySiret,
      t.transporterCompanyVatNumber
    ])
  ].filter(Boolean);
  transportersSirets = [...new Set(transportersSirets)];

  let canAccessDraftSirets: string[] = [];
  if (paoh.status === BspaohStatus.DRAFT) {
    const ownerCompanies = await getUserCompanies(user.id);
    const ownerOrgIds = ownerCompanies.map(company => company.orgId);
    const bsdOrgIds = [
      paoh.emitterCompanySiret,
      paoh.destinationCompanySiret,
      ...transportersSirets
    ].filter(Boolean);
    const ownerOrgIdsInBsd = ownerOrgIds.filter(orgId =>
      bsdOrgIds.includes(orgId)
    );
    canAccessDraftSirets.push(...ownerOrgIdsInBsd);
    canAccessDraftSirets = [...new Set(canAccessDraftSirets)];
  }

  return { transportersSirets, canAccessDraftSirets };
};
