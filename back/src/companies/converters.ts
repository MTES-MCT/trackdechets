import { Company } from "@prisma/client";
import type { CompanyPrivate, CompanyPublic } from "@td/codegen-back";
import { libelleFromCodeNaf } from "./sirene/utils";

export function toGqlCompanyPrivate(company: Company): CompanyPrivate {
  return {
    ...company,
    ecoOrganismeAgreements:
      company.ecoOrganismeAgreements?.map(a => new URL(a)) ?? [],
    naf: company.codeNaf,
    libelleNaf: company.codeNaf ? libelleFromCodeNaf(company.codeNaf) : "",
    // les champs ci-dessous sont calculés dans le resolver CompanyPrivate
    signatureAutomations: [],
    receivedSignatureAutomations: [],
    userPermissions: [],
    userNotifications: {
      membershipRequest: false,
      signatureCodeRenewal: false,
      bsdRefusal: false,
      bsdaFinalDestinationUpdate: false,
      revisionRequest: false,
      registryDelegation: false
    }
  };
}

export function toGqlCompanyPublic(company: Company): CompanyPublic {
  return {
    ...company,
    ecoOrganismeAgreements:
      company.ecoOrganismeAgreements?.map(a => new URL(a)) ?? [],
    naf: company.codeNaf,
    isDormant: company.isDormantSince !== null,
    libelleNaf: company.codeNaf ? libelleFromCodeNaf(company.codeNaf) : ""
  };
}
