import { redisClient } from "../common/redis/redis";
import { sess } from "../server";
import { getUserSessions, genUserSessionsIdsKey } from "../common/redis/users";

/**
 * Delete all user sessions
 * Delete the sessionkeys referenced in USER_SESSIONS_CACHE_KEY
 * @param userId
 */

export async function clearUserSessions(userId: string): Promise<void> {
  const sessions = await getUserSessions(userId);

  sessions.forEach(sessionId => sess.store?.destroy(sessionId));

  await redisClient.del(genUserSessionsIdsKey(userId));
}
