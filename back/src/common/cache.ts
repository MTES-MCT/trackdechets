import { redisClient } from "./redis";
import { getUserCompanies } from "../users/database";

const cacheKey = (userId: string): string => `user-${userId}`;

const MINUTES = 60;
export async function setUserSirets(
  userId: string,
  sirets: string[]
): Promise<void> {
  // await redisClient.sadd(cacheKey(userId), sirets);
  // await redisClient.expire(cacheKey(userId), 10 * MINUTES);
  await redisClient
    .pipeline()
    .sadd(cacheKey(userId), sirets)
    .expire(cacheKey(userId), 10 * MINUTES)
    .exec();
}

export async function getUserSirets(userId: string): Promise<string[]> {
  const key = `user_${userId}`;
  const exists = await redisClient.exists(key);
  if (!!exists) {
    return redisClient.smembers(key);
  }

  const companies = await getUserCompanies(userId);
  const sirets = companies.map(c => c.siret);

  await setUserSirets(userId, sirets);
  return sirets;
}
