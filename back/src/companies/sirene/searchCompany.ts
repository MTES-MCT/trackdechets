import { searchCompany as searchCompanyInsee } from "./insee/client";
import { searchCompany as searchCompanyDataGouv } from "./entreprise.data.gouv.fr/client";
import { backoffIfTooManyRequests, throttle } from "./ratelimit";
import { redundant } from "./redundancy";
import { cache } from "./cache";
import { setInMaintenanceIf } from "./maintenance";

const { INSEE_MAINTENANCE } = process.env;

/**
 * Apply throttle, redundant and cache decorators to searchCompany functions
 * We use INSEE API in priority and fall back to entreprise.data.gouv.fr
 */
const decoratedSearchCompany = cache(
  redundant(
    setInMaintenanceIf(
      backoffIfTooManyRequests(searchCompanyInsee, {
        service: "insee"
      }),
      INSEE_MAINTENANCE === "true"
    ),
    throttle(searchCompanyDataGouv, {
      service: "data_gouv",
      requestsPerSeconds: 8
    })
  )
);

export default function searchCompany(siret: string) {
  return decoratedSearchCompany(siret);
}
