import { redisClient, generateKey } from "./redis";
import { USER_ROLES_CACHE_KEY } from "../../permissions/permissions";

const CACHED_COMPANY_EXPIRATION = 10 * 60; // 10 minutes

export const genUserRolesCacheKey = (userId: string): string =>
  generateKey(USER_ROLES_CACHE_KEY, userId);

export const getUserLoginFailedKey = (email: string): string =>
  generateKey("userLoginFailed", email);

/**
 * Unlink the cached roles for a given user
 * @param userId
 */
export async function deleteCachedUserRoles(userId: string): Promise<void> {
  const cacheKey = genUserRolesCacheKey(userId); // non-existent keys are ignored
  await redisClient.unlink(cacheKey);
  await redisClient.unlink(`${cacheKey}:lock`);
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
  const key = genUserRolesCacheKey(userId);

  await redisClient
    .pipeline()
    .sadd(key, ids)
    .expire(key, CACHED_COMPANY_EXPIRATION)
    .exec();
}
