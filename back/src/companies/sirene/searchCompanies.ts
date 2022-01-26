import { searchCompanies as searchCompaniesInsee } from "./insee/client";
import { searchCompanies as searchCompaniesDataGouv } from "./entreprise.data.gouv.fr/client";
import { backoffIfTooManyRequests, throttle } from "./ratelimit";
import { redundant } from "./redundancy";

/**
 * Apply throttle and redundant decorator to searchCompanies functions
 * We use entreprise.data.gouv.fr API in priority and fallback to INSEE
 * because fuzzy search is way better in entreprise.data.gouv.fr
 */
const decoratedSearchCompanies = redundant(
  backoffIfTooManyRequests(searchCompaniesInsee, {
    service: "insee"
  }),
  throttle(searchCompaniesDataGouv, {
    service: "data_gouv",
    requestsPerSeconds: 8
  })
);

export default decoratedSearchCompanies;
