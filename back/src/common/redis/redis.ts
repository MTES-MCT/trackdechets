import IORedis from "ioredis";

const { REDIS_URL } = process.env;

export const redisClient = REDIS_URL
  ? new IORedis(REDIS_URL)
  : new IORedis({ host: "redis" });

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

type Parser = { parse: (s: string) => any; stringify: (v: any) => string };
const defaultParser: Parser = {
  parse: v => v,
  stringify: v => v
};

export type SetOptions = {
  EX?: number; // EX seconds -- Set the specified expire time, in seconds.
  PX?: number; // PX milliseconds -- Set the specified expire time, in milliseconds.
  NX?: boolean; // NX -- Only set the key if it does not already exist.
  XX?: boolean; // XX -- Only set the key if it already exists.
};

export async function cachedGet<T>(
  getter: (itemKey: string | number) => Promise<T>,
  objectType: string,
  itemKey: string | number,
  settings: { parser?: Parser; options?: SetOptions } = {}
): Promise<T> {
  const { parser = defaultParser, options = {} } = settings;
  const cacheKey = generateKey(objectType, itemKey);

  const redisValue = await redisClient.get(cacheKey).catch(_ => null);

  if (redisValue != null) {
    return parser.parse(redisValue);
  }

  const dbValue = await getter(itemKey);

  // No need to await the set, and it doesn't really matters if it fails
  setInCache(cacheKey, parser.stringify(dbValue), options).catch(_ => null);

  return dbValue;
}

export async function setInCache(
  key: string,
  value: any,
  options: SetOptions = {}
) {
  const setOptions = Object.keys(options)
    .map(optionKey => {
      const val = options[optionKey];
      // Some options don't have an associated value
      if (isNaN(val)) {
        return [optionKey];
      }
      return [optionKey, val];
    })
    .reduce((acc, val) => acc.concat(val), []);

  return redisClient.set(key, value, setOptions);
}

/**
 * Set or incr an int value in cache and set expiration
 * @param key
 * @expire value
 * @returns
 */
export async function setOrIncr(key: string, expire: number) {
  return redisClient.pipeline().incr(key).expire(key, expire).exec();
}
