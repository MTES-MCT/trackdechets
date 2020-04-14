import { UserInputError } from "apollo-server-express";
import { cachedGet } from "../../common/redis";
import { searchCompany } from "./client";

export const COMPANY_INFOS_CACHE_KEY = "CompanyInfos";
const EXPIRY_TIME = 60 * 60 * 24;

/**
 * Wrap calls to searchCompany
 * It performs validation and return from cache if key is present
 * @param siret
 */
export function searchCompanyCached(
  siret: string
): Promise<CompanySearchResult> {
  if (siret.length !== 14) {
    throw new UserInputError("Le siret doit faire 14 caractères", {
      invalidArgs: ["siret"]
    });
  }

  return cachedGet(searchCompany, COMPANY_INFOS_CACHE_KEY, siret, {
    parser: JSON,
    options: { EX: EXPIRY_TIME }
  });
}
