import { UserInputError } from "apollo-server-express";
import {
  CompanyPublic,
  CompanySearchPrivate,
  QueryResolvers
} from "../../../generated/graphql/types";
import { getInstallation } from "../../database";
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
): Promise<CompanyPublic | CompanySearchPrivate> {
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
    installation: await getInstallation(siretOrVat)
  };
}

const companyInfosResolvers: QueryResolvers["companyInfos"] = async (
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
  const companyInfos = (await getCompanyInfos(
    !!args.siret ? args.siret : args.clue
  )) as CompanyPublic;
  if (companyInfos.statutDiffusionEtablissement !== "N") {
    return companyInfos;
  } else {
    // hide non-diffusible Company from public query
    return {
      siret: companyInfos.siret,
      vatNumber: companyInfos.vatNumber,
      isRegistered: companyInfos.isRegistered,
      companyTypes: companyInfos.companyTypes,
      ecoOrganismeAgreements: companyInfos.ecoOrganismeAgreements,
      statutDiffusionEtablissement: companyInfos.statutDiffusionEtablissement
    };
  }
};

export default companyInfosResolvers;
