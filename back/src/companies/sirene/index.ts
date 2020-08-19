import {
  searchCompany as searchCompanyInsee,
  searchCompanies as searchCompaniesInsee
} from "./insee/client";
import {
  searchCompany as searchCompanyDataGouv,
  searchCompanies as searchCompaniesDataGouv
} from "./entreprise.data.gouv.fr/client";
import { CompanySearchResult } from "../../generated/graphql/types";
import { throttle } from "./ratelimit";
import { redundant } from "./redundancy";
import { cache } from "./cache";
import { UserInputError } from "apollo-server-express";

const INSEE_THROTTLE_KEY = "insee_throttle";
const DATA_GOUV_THROTTLE_KEY = "data_gouv_throttle";

function throttleErrorMessage(apiType: string) {
  return `Trop de requêtes sur l'API Sirene ${apiType}`;
}

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

export function searchCompany(siret: string): Promise<CompanySearchResult> {
  if (siret.length !== 14) {
    throw new UserInputError("Le siret doit faire 14 caractères", {
      invalidArgs: ["siret"]
    });
  }
  return decoratedSearchCompany(siret);
}

/**
 * Apply throttle and redundant decorator to searchCompanies functions
 * We use entreprise.data.gouv.fr API in priority and fallback to INSEE
 * because fuzzy search is way better in entreprise.data.gouv.fr
 */
const decoratedSearchCompanies = redundant(
  throttle(searchCompaniesDataGouv, {
    cacheKey: DATA_GOUV_THROTTLE_KEY,
    errorMessage: throttleErrorMessage("entreprise.data.gouv.fr")
  }),
  throttle(searchCompaniesInsee, {
    cacheKey: INSEE_THROTTLE_KEY,
    errorMessage: throttleErrorMessage("INSEE")
  })
);

export function searchCompanies(
  clue: string,
  department?: string
): Promise<CompanySearchResult[]> {
  return decoratedSearchCompanies(clue, department);
}
