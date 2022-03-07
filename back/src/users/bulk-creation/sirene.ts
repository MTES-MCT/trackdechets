import { CompanyRow, CompanyInfo } from "./types";
import { searchCompany as dataGouv } from "../../companies/sirene/entreprise.data.gouv.fr/client";
import { searchCompany as insee } from "../../companies/sirene/insee/client";
import { searchCompany as socialGouv } from "../../companies/sirene/social.gouv/client";
import { searchCompany as trackdechets } from "../../companies/sirene/trackdechets/client";
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
  let throttledClient = null;
  switch (opts.sireneProvider) {
    case "entreprise.data.gouv.fr":
      throttledClient = dataGouv;
      break;

    case "social.gouv":
      throttledClient = socialGouv(siret);
      break;

    case "insee":
      throttledClient = insee(siret);
      break;

    default:
      // Not throtlled client
      return trackdechets(siret);
  }

  if (throttledClient) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        throttledClient(siret)
          .then(c => resolve(c))
          .catch(err => reject(err));
      }, 500);
    });
  }
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
