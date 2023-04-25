import { client } from "./vies/client";
import { cache } from "../sirene/cache";
import { backoffIfTestEnvs, throttle } from "../sirene/ratelimit";
import { CompanyVatSearchResult } from "./vies/types";

/**
 * Apply throttling & caching, bu non-redundant on searchVat
 * Also avoid requesting VIES api in test env
 */
const throttledSearchVat = backoffIfTestEnvs<CompanyVatSearchResult>(
  throttle(client, {
    service: "vies",
    requestsPerSeconds: 10
  })
);

const decoratedSearchVat = cache<CompanyVatSearchResult | null>(
  throttledSearchVat
);

interface SearchVatDeps {
  searchVat: (vat: string) => Promise<CompanyVatSearchResult | null>;
}

export const makeSearchVat =
  ({ searchVat }: SearchVatDeps) =>
  (vat: string) =>
    searchVat(vat);

// use dependency injection here to easily mock `searchVat`
// in index.test.ts
export const searchVat = makeSearchVat({
  searchVat: decoratedSearchVat
});
