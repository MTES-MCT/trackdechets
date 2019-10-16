import * as Redis from "ioredis";
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

export async function cachedGet(
  getter: (itemKey) => Promise<any>,
  objectType: string,
  itemKey: string | number,
  parser = defaultParser
) {
  const cacheKey = generateKey(objectType, itemKey);

  const redisValue = await redis.get(cacheKey).catch(_ => null);

  if (redisValue != null) {
    return parser.parse(redisValue);
  }

  try {
    const dbValue = await getter(itemKey);

    // No need to await the set, and it doesn't really matters if it fails
    redis.set(cacheKey, parser.stringify(dbValue)).catch(_ => null);

    return dbValue;
  } catch (err) {
    throw err;
  }
}
