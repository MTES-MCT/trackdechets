import { CompanyRow, CompanyInfo } from "./types";
import { searchCompany as dataGouv } from "../../companies/sirene/entreprise.data.gouv.fr/client";
import { searchCompany as insee } from "../../companies/sirene/insee/client";
import { searchCompany as socialGouv } from "../../companies/sirene/social.gouv/client";
import geocode from "../../companies/geocode";
import { CompanySearchResult } from "../../generated/graphql/types";
import { Opts } from ".";

/**
 * Throttled version of getCompanyInfo to avoid hitting rate limit
 * of 7 requests / seconds
 * We wait 500ms before executing the function
 * @param siret
 */
export function getCompanyThrottled(
  siret: string,
  opts: Opts
): Promise<CompanySearchResult> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      switch (opts.sireneProvider) {
        case "entreprise.data.gouv.fr":
          dataGouv(siret)
            .then(c => resolve(c))
            .catch(err => reject(err));
          break;

        case "social.gouv":
          socialGouv(siret)
            .then(c => resolve(c))
            .catch(err => reject(err));
          break;

        case "insee":
          insee(siret)
            .then(c => resolve(c))
            .catch(err => reject(err));
          break;

        default:
          dataGouv(siret)
            .then(c => resolve(c))
            .catch(err => reject(err));
          break;
      }
    }, 500);
  });
}

/**
 * Validate SIRET against SIRENE database and add company name
 * @param companies
 */
export async function sirenify(
  company: CompanyRow,
  opts: Opts
): Promise<CompanyRow & CompanyInfo> {
  const {
    naf: codeNaf,
    name,
    address
  } = await getCompanyThrottled(company.siret, opts);
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
