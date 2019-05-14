import * as Redis from "ioredis";
import { prisma } from "../generated/prisma-client";
export const redis = new Redis({ host: "redis" });

/**
 * Generate a cache key
 *
 * Ex:
 * - user:100
 * - user-pref:200:password
 *
 * @param objectType
 * @param id
 * @param field optional field
 */
export function generateKey(
  objectType: string,
  id: string | number,
  field?: string
) {
  return [objectType, id.toString(), field]
    .filter(Boolean)
    .map(v => v.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()) // CamelCase to kebab-case
    .join(":");
}

const defaultParser = {
  parse: v => v,
  stringify: v => v
};

export async function getByIdFromCache(
  getter: Function,
  id: string | number,
  parser = defaultParser
) {
  const objectType = getter.name;

  if (!(objectType in prisma))
    throw new Error(`Unknown object type "${objectType}" in prisma model.`);

  const key = generateKey(objectType, id);

  try {
    const redisValue = await redis.get(key).catch(_ => null);

    if (redisValue != null) {
      return parser.parse(redisValue);
    }

    const dbValue = await getter({ id });
    // No need to await the set, and it doesn't really matters if it fails
    redis.set(key, parser.stringify(dbValue)).catch(_ => null);

    return dbValue;
  } catch (err) {
    return null;
  }
}
