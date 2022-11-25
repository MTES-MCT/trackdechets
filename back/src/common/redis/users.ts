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
 * Retrieve cached Company siret and vatNumber
 * if found in redis, or query the db and cache them
 * @param userId
 * @returns array of sirets and vatNumber
 */
export async function getCachedUserSiretOrVat(
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

export const USER_SESSIONS_CACHE_KEY = "users-sessions-id";

export async function storeUserSessionId(
  userId: string,
  req: Express.Request
): Promise<void> {
  if (!userId) {
    return;
  }

  await redisClient.sadd(
    `${USER_SESSIONS_CACHE_KEY}-${userId}`,
    req.session.id
  );
}

export async function getUserSessions(userId: string): Promise<string[]> {
  if (!userId) {
    return;
  }

  return redisClient.smembers(`${USER_SESSIONS_CACHE_KEY}-${userId}`);
}
