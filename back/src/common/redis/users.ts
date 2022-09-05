import { redisClient, generateKey } from "./redis";
import { getUserCompanies } from "../../users/database";

const CACHED_COMPANY_EXPIRATION = 10 * 60; // 10 minutes

export const getUserCompanySiretCacheKey = (userId: string): string =>
  generateKey("userSirets", userId);

export const getUserCompaniesCacheKey = (userId: string): string =>
  generateKey("userCompanies", userId);

/**
 * Delete the cached sirets for a given user
 * @param userId
 */
export async function deleteCachedUserCompanies(userId: string): Promise<void> {
  const sirets = getUserCompanySiretCacheKey(userId); // non-existent keys are ignored
  const ids = getUserCompaniesCacheKey(userId); // non-existent keys are ignored
  await Promise.all([redisClient.unlink(sirets), redisClient.unlink(ids)]);
}

/**
 * Store Company id in a redis SET
 * @param userId
 * @param ids
 */
export async function setCachedUserCompanyId(
  userId: string,
  ids: string[]
): Promise<void> {
  const key = getUserCompaniesCacheKey(userId);

  await redisClient
    .pipeline()
    .sadd(key, ids)
    .expire(key, CACHED_COMPANY_EXPIRATION)
    .exec();
}

/**
 * Store sirets in a redis SET
 * @param userId
 * @param sirets
 */
export async function setCachedUserSirets(
  userId: string,
  sirets: string[]
): Promise<void> {
  const key = getUserCompanySiretCacheKey(userId);

  await redisClient
    .pipeline()
    .sadd(key, sirets)
    .expire(key, CACHED_COMPANY_EXPIRATION)
    .exec();
}

/**
 * Retrieve cached Company siret and vatNumber
 * if found in redis, or query the db and cache them
 * @param userId
 * @returns array of sirets and vatNumber
 */
export async function getCachedUserCompanies(
  userId: string
): Promise<string[]> {
  const key = getUserCompaniesCacheKey(userId);
  const exists = await redisClient.exists(key);
  if (!!exists) {
    return redisClient.smembers(key);
  }
  // refresh cache
  const companies = await getUserCompanies(userId);
  const ids = [
    ...companies.map(c => c.siret),
    ...companies.map(c => c.vatNumber)
  ];
  const cleanIds = ids.filter(id => !!id);
  await setCachedUserCompanyId(userId, cleanIds);
  return cleanIds;
}
