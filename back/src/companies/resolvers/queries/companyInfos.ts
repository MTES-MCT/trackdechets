import { UserInputError } from "apollo-server-express";
import {
  CompanyPublic,
  QueryResolvers
} from "../../../generated/graphql/types";
import { searchCompany } from "../../search";

/**
 * This function is used to return public company
 * information for a specific siret or VAT number. It merge info
 * from Sirene or VIES vat database, S3ic database and TD without
 * exposing private TD info like securityCode, users, etc
 *
 * @param siretOrVat
 */
export async function getCompanyInfos(
  siretOrVat: string
): Promise<CompanyPublic> {
  if (siretOrVat === undefined || !siretOrVat.length) {
    throw new UserInputError(
      "Paramètre absent. Un numéro SIRET ou de TVA intracommunautaire valide est requis",
      {
        invalidArgs: ["clue"]
      }
    );
  }
  const searchResult = await searchCompany(siretOrVat);
  return {
    ...searchResult,
    ecoOrganismeAgreements: searchResult.ecoOrganismeAgreements ?? [],
    companyTypes: searchResult.companyTypes ?? []
  };
}

const companyInfosResolvers: QueryResolvers["companyInfos"] = (
  parent,
  args
) => {
  if (args.siret === undefined && args.clue === undefined) {
    throw new UserInputError(
      "Paramètre siret et clue absents. Un numéro SIRET ou de TVA intracommunautaire valide est requis",
      {
        invalidArgs: ["clue", "siret"]
      }
    );
  }
  return getCompanyInfos(!!args.siret ? args.siret : args.clue);
};

export default companyInfosResolvers;
