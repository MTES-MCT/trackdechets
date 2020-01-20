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

type Parser = { parse: (s: string) => any; stringify: (v: any) => string };
const defaultParser: Parser = {
  parse: v => v,
  stringify: v => v
};

type SetOptions = {
  EX?: number; // EX seconds -- Set the specified expire time, in seconds.
  PX?: number; // PX milliseconds -- Set the specified expire time, in milliseconds.
  NX?: boolean; // NX -- Only set the key if it does not already exist.
  XX?: boolean; // XX -- Only set the key if it already exist.
};

export async function cachedGet(
  getter: (itemKey) => Promise<any>,
  objectType: string,
  itemKey: string | number,
  settings: { parser?: Parser; options?: SetOptions } = {}
) {
  const { parser = defaultParser, options = {} } = settings;
  const cacheKey = generateKey(objectType, itemKey);

  const redisValue = await redis.get(cacheKey).catch(_ => null);

  if (redisValue != null) {
    return parser.parse(redisValue);
  }

  try {
    const dbValue = await getter(itemKey);

    // No need to await the set, and it doesn't really matters if it fails
    setInCache(cacheKey, parser.stringify(dbValue), options).catch(_ => null);

    return dbValue;
  } catch (err) {
    throw err;
  }
}

export async function setInCache(
  key: string,
  value: any,
  options: SetOptions = {}
) {
  const setOptions = Object.keys(options)
    .map(key => {
      const val = options[key];
      // Some options don't have an associated value
      if (isNaN(val)) {
        return [key];
      }
      return [key, val];
    })
    .reduce((acc, val) => acc.concat(val), []);

  return redis.set(key, value, setOptions);
}
