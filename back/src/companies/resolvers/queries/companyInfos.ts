import { UserInputError } from "apollo-server-express";
import {
  CompanyPublic,
  CompanySearchPrivate,
  QueryResolvers
} from "../../../generated/graphql/types";
import { getInstallation } from "../../database";
import { searchCompany } from "../../search";

/**
 * Recherche et renvoie les données diffusables
 * sur une entreprise pour un numéro de SIRET ou de TVA
 * Fusionnant les infos des bases Tracdéchets et S3IC
 * si elles existent
 * Renvoie le type CompanyPublic pour la query companyInfos
 * et le type CompanySearchPrivate pour la query companyPrivateInfos
 *
 * @param siretOrVat
 */
export async function getCompanyInfos(
  siretOrVat: string
): Promise<CompanyPublic | CompanySearchPrivate> {
  if (!siretOrVat) {
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
  _,
  args
) => {
  if (!args.siret && !args.clue) {
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
