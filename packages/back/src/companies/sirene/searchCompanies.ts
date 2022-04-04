import { searchCompanies as searchCompaniesInsee } from "./insee/client";
import { searchCompanies as searchCompaniesDataGouv } from "./entreprise.data.gouv.fr/client";
import { searchCompanies as searchCompaniesSocialGouv } from "./social.gouv/client";
import { searchCompanies as searchCompaniesTD } from "./trackdechets/client";
import {
  backoffIfTestEnvs,
  backoffIfTooManyRequests,
  throttle
} from "./ratelimit";
import { redundant } from "./redundancy";

const searchCompaniesInseeThrottled = backoffIfTestEnvs(
  backoffIfTooManyRequests(searchCompaniesInsee, {
    service: "insee"
  })
);

const searchCompaniesDataGouvThrottled = backoffIfTestEnvs(
  throttle(searchCompaniesDataGouv, {
    service: "data_gouv",
    requestsPerSeconds: 8
  })
);

const searchCompaniesSocialGouvThrottled = backoffIfTestEnvs(
  throttle(searchCompaniesSocialGouv, {
    service: "social_gouv",
    requestsPerSeconds: 50
  })
);

// list different implementations of searchCompanies by
// order of priority.
const searchCompaniesProviders = [
  searchCompaniesTD,
  searchCompaniesInseeThrottled,
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
