import { client } from "./vies/searchVat";
import { cache } from "../sirene/cache";
import { backoffIfTestEnvs, throttle } from "../sirene/ratelimit";
import { CompanyVatSearchResult } from "./vies/types";

/**
 * Apply throttling & cacheing, bu non-redundant on searchVat
 * Also avoid requesting VIES api in test env
 */
const throttledSearchVat = backoffIfTestEnvs(
  throttle(client, {
    service: "vies",
    requestsPerSeconds: 10
  })
);

const decoratedSearchVat = cache(throttledSearchVat);

interface SearchVatDeps {
  searchVat: (vat: string) => Promise<CompanyVatSearchResult>;
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
