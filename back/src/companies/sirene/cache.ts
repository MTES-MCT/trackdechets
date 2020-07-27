import { cachedGet } from "../../common/redis";

export const COMPANY_INFOS_CACHE_KEY = "CompanyInfos";
const EXPIRY_TIME = 60 * 60 * 24;

export function cache<U>(fn: (v: string) => Promise<U>) {
  const cached = (v: string) => {
    return cachedGet<U>(fn, COMPANY_INFOS_CACHE_KEY, v, {
      parser: JSON,
      options: { EX: EXPIRY_TIME }
    });
  };

  return cached;
}
