import { searchCompanies as searchCompaniesInsee } from "./insee/client";
import { searchCompanies as searchCompaniesDataGouv } from "./entreprise.data.gouv.fr/client";
import { searchCompanies as searchCompaniesSocialGouv } from "./social.gouv/client";
import { backoffIfTooManyRequests, throttle } from "./ratelimit";
import { redundant } from "./redundancy";

const { INSEE_MAINTENANCE } = process.env;

const searchCompaniesInseeThrottled = backoffIfTooManyRequests(
  searchCompaniesInsee,
  {
    service: "insee"
  }
);

const searchCompaniesDataGouvThrottled = throttle(searchCompaniesDataGouv, {
  service: "data_gouv",
  requestsPerSeconds: 8
});

const searchCompaniesSocialGouvThrottled = throttle(searchCompaniesSocialGouv, {
  service: "social_gouv",
  requestsPerSeconds: 50
});

// list differents implementations of searchCompanies by
// order of priority.
const searchCompaniesProviders = [
  ...(INSEE_MAINTENANCE === "true" ? [] : [searchCompaniesInseeThrottled]),
  searchCompaniesDataGouvThrottled,
  searchCompaniesSocialGouvThrottled
];

/**
 * Apply throttle and redundant decorator to searchCompanies functions
 * We use entreprise.data.gouv.fr API in priority and fallback to INSEE
 * because fuzzy search is way better in entreprise.data.gouv.fr
 */
const decoratedSearchCompanies = redundant(...searchCompaniesProviders);

export default decoratedSearchCompanies;
