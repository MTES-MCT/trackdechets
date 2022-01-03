import { redisClient, generateKey } from "./redis";
import { getUserCompanies } from "../users/database";

export const cacheKey = (userId: string): string =>
  generateKey("userSirets", userId);

const MINUTES = 60;

export async function deleteCachedUserSirets(userId: string): Promise<void> {
  const key = cacheKey(userId); // non-existent keys are ignored
  await redisClient.unlink(key);
}

export async function setCachedUserSirets(
  userId: string,
  sirets: string[]
): Promise<void> {
  const key = cacheKey(userId);
  await redisClient
    .pipeline()
    .sadd(key, sirets)
    .expire(key, 10 * MINUTES)
    .exec();
}

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
