import { searchCompanies as searchCompaniesInsee } from "./insee/client";
import { searchCompanies as searchCompaniesTD } from "./trackdechets/client";
import { backoffIfTestEnvs, backoffIfTooManyRequests } from "./ratelimit";
import { redundant } from "./redundancy";
import { SireneSearchResult } from "./types";

const searchCompaniesInseeThrottled = backoffIfTestEnvs<SireneSearchResult[]>(
  backoffIfTooManyRequests(searchCompaniesInsee, {
    service: "insee"
  })
);

// list different implementations of searchCompanies by
// order of priority.
const searchCompaniesProviders = [
  searchCompaniesTD,
  searchCompaniesInseeThrottled
];

/**
 * Apply throttle and redundant decorator to searchCompanies functions
 * We use our own search engine in priority and fallback to INSEE
 */
const decoratedSearchCompanies = redundant(...searchCompaniesProviders);

export default decoratedSearchCompanies;
