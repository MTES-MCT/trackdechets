import { redisClient, generateKey } from "./redis";
import { getUserCompanies } from "../../users/database";

export const cacheKey = (userId: string): string =>
  generateKey("userSirets", userId);

const CACHED_SIRET_EXPIRATION = 10 * 60; // 10 minutes

/**
 * Delete the cached sirets for a given user
 * @param userId
 */
export async function deleteCachedUserSirets(userId: string): Promise<void> {
  const key = cacheKey(userId); // non-existent keys are ignored
  await redisClient.unlink(key);
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
  const key = cacheKey(userId);

  await redisClient
    .pipeline()
    .sadd(key, sirets)
    .expire(key, CACHED_SIRET_EXPIRATION)
    .exec();
}

/**
 * Retrieve cached sirets if found in redis, or query the db and cache them
 * @param userId
 * @returns array of sirets
 */
export async function getCachedUserSirets(userId: string): Promise<string[]> {
  const key = cacheKey(userId);
  const exists = await redisClient.exists(key);
  if (!!exists) {
    return redisClient.smembers(key);
  }

  const companies = await getUserCompanies(userId);
  const sirets = companies.map(c => c.siret);

  await setCachedUserSirets(userId, sirets);
  return sirets;
}
