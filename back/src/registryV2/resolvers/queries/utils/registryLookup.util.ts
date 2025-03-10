import {
  RegistryImportType,
  RegistryExportType,
  RegistryExportWasteType,
  RegistryLookup
} from "@prisma/client";
import { prisma } from "@td/prisma";
import { getUserCompanies } from "../../../../users/database";
import { UserInputError } from "../../../../common/errors";
import { getDelegatorsByDelegateForEachCompanies } from "../../../../registryDelegation/database";

export function getTypeFilter(type: RegistryImportType | null) {
  switch (type) {
    case "INCOMING_TEXS":
      return {
        exportRegistryType: RegistryExportType.INCOMING,
        wasteType: RegistryExportWasteType.TEXS
      };
    case "INCOMING_WASTE":
      return {
        exportRegistryType: RegistryExportType.INCOMING,
        wasteType: {
          in: [RegistryExportWasteType.DD, RegistryExportWasteType.DND]
        }
      };
    case "OUTGOING_TEXS":
      return {
        exportRegistryType: RegistryExportType.OUTGOING,
        wasteType: RegistryExportWasteType.TEXS
      };
    case "OUTGOING_WASTE":
      return {
        exportRegistryType: RegistryExportType.OUTGOING,
        wasteType: {
          in: [RegistryExportWasteType.DD, RegistryExportWasteType.DND]
        }
      };
    case "SSD":
      return {
        exportRegistryType: RegistryExportType.SSD
      };
    case "MANAGED":
      return {
        exportRegistryType: RegistryExportType.MANAGED
      };
    case "TRANSPORTED":
      return {
        exportRegistryType: RegistryExportType.TRANSPORTED
      };
    default:
      return {};
  }
}

export function getTypeFromLookup(lookup: RegistryLookup) {
  if (lookup.exportRegistryType === RegistryExportType.INCOMING) {
    if (lookup.wasteType === RegistryExportWasteType.TEXS) {
      return RegistryImportType.INCOMING_TEXS;
    }
    return RegistryImportType.INCOMING_WASTE;
  }

  if (lookup.exportRegistryType === RegistryExportType.OUTGOING) {
    if (lookup.wasteType === RegistryExportWasteType.TEXS) {
      return RegistryImportType.OUTGOING_TEXS;
    }
    return RegistryImportType.OUTGOING_WASTE;
  }

  if (lookup.exportRegistryType === RegistryExportType.MANAGED) {
    return RegistryImportType.MANAGED;
  }
  if (lookup.exportRegistryType === RegistryExportType.TRANSPORTED) {
    return RegistryImportType.TRANSPORTED;
  }
  if (lookup.exportRegistryType === RegistryExportType.SSD) {
    return RegistryImportType.SSD;
  }

  throw new Error("Unknown registry import type, check lookup conditions");
}

export async function getLookupsFilterInfos({
  siret,
  userId
}: {
  siret: string;
  userId: string;
}) {
  const userCompanies = await getUserCompanies(userId);

  const filteredOnCompany = await prisma.company.findUnique({
    where: { siret }
  });
  if (!filteredOnCompany) {
    throw new UserInputError("Impossible de filtrer sur ce SIRET");
  }

  const userCompanyIds = userCompanies.map(company => company.id);

  const siretsThatCanAccessLookup = [siret];
  const reportAsIdsFilter: string[] = [];

  if (!userCompanyIds.includes(filteredOnCompany.id)) {
    const delegatorSiretsByDelegateSirets =
      await getDelegatorsByDelegateForEachCompanies(userCompanyIds);

    for (const [
      delegateSiret,
      delegators
    ] of delegatorSiretsByDelegateSirets.entries()) {
      if (delegators.includes(siret)) {
        siretsThatCanAccessLookup.push(delegateSiret);
        const delegate = userCompanies.find(
          company => company.orgId === delegateSiret
        );
        if (delegate) {
          reportAsIdsFilter.push(delegate.orgId);
        }
      }
    }
  }

  return {
    siretsThatCanAccessLookup,
    reportAsIdsFilter
  };
}
