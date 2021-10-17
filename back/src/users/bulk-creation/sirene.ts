import { CompanyRow, CompanyInfo } from "./types";
import { searchCompany } from "../../companies/sirene/entreprise.data.gouv.fr/client";
import geocode from "../../companies/geocode";
import { CompanySearchResult } from "../../generated/graphql/types";

/**
 * Throttled version of getCompanyInfo to avoid hitting rate limit
 * of 7 requests / seconds
 * We wait 500ms before executing the function
 * @param siret
 */
export function getCompanyThrottled(
  siret: string
): Promise<CompanySearchResult> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      searchCompany(siret)
        .then(c => resolve(c))
        .catch(err => reject(err));
    }, 500);
  });
}

/**
 * Validate SIRET against SIRENE database and add company name
 * @param companies
 */
export async function sirenify(
  company: CompanyRow
): Promise<CompanyRow & CompanyInfo> {
  const { naf: codeNaf, name, address } = await getCompanyThrottled(
    company.siret
  );
  const { latitude, longitude } = await geocode(address);
  return {
    ...company,
    address,
    latitude,
    longitude,
    codeNaf,
    name
  };
}
