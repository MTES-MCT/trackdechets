import { searchCompany as searchCompanyInsee } from "./insee/client";
import { searchCompany as searchCompanyDataGouv } from "./entreprise.data.gouv.fr/client";
import {
  throttle,
  throttleErrorMessage,
  INSEE_THROTTLE_KEY,
  DATA_GOUV_THROTTLE_KEY
} from "./ratelimit";
import { redundant } from "./redundancy";
import { cache } from "./cache";

/**
 * Apply throttle, redundant and cache decorators to searchCompany functions
 * We use INSEE API in priority and fall back to entreprise.data.gouv.fr
 */
const decoratedSearchCompany = cache(
  redundant(
    throttle(searchCompanyInsee, {
      cacheKey: INSEE_THROTTLE_KEY,
      errorMessage: throttleErrorMessage("INSEE")
    }),
    throttle(searchCompanyDataGouv, {
      cacheKey: DATA_GOUV_THROTTLE_KEY,
      errorMessage: throttleErrorMessage("entreprise.data.gouv.fr")
    })
  )
);

//export default decoratedSearchCompany

export default function searchCompany(siret: string) {
  return decoratedSearchCompany(siret);
}
