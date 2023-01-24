import { UserInputError } from "apollo-server-core";
import { isObject } from "../forms/workflow/diff";
import {
  CompanyValidationInput,
  CompanyValidationInfos
} from "../generated/graphql/types";
import { searchCompany } from "./search";

/**
 * Validate a Company input
 * auto-complete information with info from INSEE Sirene
 */
export async function validateCompany(
  company: CompanyValidationInput,
  errorPrefix = "Intermédiaires: "
): Promise<CompanyValidationInfos> {
  if (!isObject(company) || !Object.keys(company)) {
    throw new UserInputError(
      `${errorPrefix}Obligatoirement spécifier un SIRET`
    );
  }
  // validate input because the query accepts both optional siret or vatNumber
  if (!company.siret) {
    if (!company.vatNumber) {
      throw new UserInputError(
        `${errorPrefix}Obligatoirement spécifier soit un SIRET soit un numéro de TVA intracommunautaire`
      );
    } else {
      throw new UserInputError(
        `${errorPrefix}Obligatoirement spécifier un SIRET`
      );
    }
  }
  const { siret, vatNumber } = company;
  try {
    const companySearchResult = await searchCompany(siret || vatNumber);
    return {
      siret: companySearchResult.siret!, // presence of SIRET is validated in intermediarySchema
      vatNumber: companySearchResult.vatNumber ?? "",
      address: companySearchResult?.address ?? company.address,
      name: companySearchResult?.name ?? company.name,
      isRegistered: companySearchResult?.isRegistered,
      statutDiffusionEtablissement:
        companySearchResult?.statutDiffusionEtablissement,
      etatAdministratif: companySearchResult?.etatAdministratif as "A" | "F"
    };
  } catch (exc) {
    if (exc instanceof UserInputError) {
      throw new UserInputError(`${errorPrefix} ${exc.message}`, {
        invalidArgs: ["siret", "vatNumber"]
      });
    } else {
      throw exc;
    }
  }
}
