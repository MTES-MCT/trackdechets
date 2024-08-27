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

export const USER_SESSIONS_CACHE_KEY = "users-sessions-id";

export const genUserSessionsIdsKey = (userId: string): string =>
  `${USER_SESSIONS_CACHE_KEY}-${userId}`;

/**
 * Persist a redis set `users-sessions-id:${userId}`: {sessionID1, sessionID2, sessionID3} to ease session retrieval and deletion
 * @param userId
 * @param sessionId: the id without the "sess:"" part
 * @returns
 */
export async function storeUserSessionsId(
  userId: string,
  sessionId: string
): Promise<void> {
  if (!userId) {
    return;
  }

  await redisClient.sadd(genUserSessionsIdsKey(userId), sessionId);
}

export async function getUserSessions(userId: string): Promise<string[]> {
  if (!userId) {
    return [];
  }
  return redisClient.smembers(genUserSessionsIdsKey(userId));
}
