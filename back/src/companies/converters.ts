import { Company } from "@prisma/client";
import { CompanyPrivate } from "../generated/graphql/types";
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
    userNotifications: []
  };
}
