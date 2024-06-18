import { searchCompany as searchCompanyInsee } from "./insee/client";
import { searchCompany as searchCompanyTD } from "./trackdechets/client";
import { backoffIfTestEnvs, backoffIfTooManyRequests } from "./ratelimit";
import { redundant } from "./redundancy";
import { cache } from "./cache";
import { SireneSearchResult } from "./types";

export const searchCompanyInseeThrottled =
  backoffIfTestEnvs<SireneSearchResult>(
    backoffIfTooManyRequests(searchCompanyInsee, {
      service: "insee"
    })
  );

// list different implementations of searchCompany by order of priority.
// please keep searchCompanyTD then searchCompanyInseeThrottled in this order
// in order to preserve anonymous companies processing
const searchCompanyProviders = [searchCompanyTD, searchCompanyInseeThrottled];

/**
 * Apply throttle, redundant and cache decorators to searchCompany functions
 */
const decoratedSearchCompany = cache<SireneSearchResult | null>(
  redundant(...searchCompanyProviders)
);

export default function searchCompany(
  siret: string
): Promise<SireneSearchResult | null> {
  console.log(">> SearchCompany")
  return decoratedSearchCompany(siret);
}
