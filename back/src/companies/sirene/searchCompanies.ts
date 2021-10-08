import { searchCompanies as searchCompaniesInsee } from "./insee/client";
import { searchCompanies as searchCompaniesDataGouv } from "./entreprise.data.gouv.fr/client";
import {
  DATA_GOUV_THROTTLE_KEY,
  INSEE_THROTTLE_KEY,
  throttle,
  throttleErrorMessage
} from "./ratelimit";
import { redundant } from "./redundancy";

/**
 * Apply throttle and redundant decorator to searchCompanies functions
 * We use entreprise.data.gouv.fr API in priority and fallback to INSEE
 * because fuzzy search is way better in entreprise.data.gouv.fr
 */
const decoratedSearchCompanies = redundant(
  throttle(searchCompaniesInsee, {
    cacheKey: INSEE_THROTTLE_KEY,
    errorMessage: throttleErrorMessage("INSEE")
  }),
  throttle(searchCompaniesDataGouv, {
    cacheKey: DATA_GOUV_THROTTLE_KEY,
    errorMessage: throttleErrorMessage("entreprise.data.gouv.fr")
  })
);

export default decoratedSearchCompanies;
