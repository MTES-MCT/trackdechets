// Taken from https://www.npmjs.com/package/lru-cache doc
// "If you truly wish to use a cache that is bound only by TTL expiration, consider using a Map object,
// and calling setTimeout to delete entries when they expire. It will perform much better than an LRU cache."
// -------
// Its used to cache company infos: when we import a file most of the lines (if not all) will share the same reportForCompanySiret.
// So we can cache the company infos for a short time to avoid querying the database for each line.

const DEFAULT_TTL = 60 * 1000 * 3; // 3 minutes

export const ttlCache = {
  data: new Map(),
  timers: new Map(),
  set: (key: string, value: unknown, ttl = DEFAULT_TTL) => {
    if (ttlCache.timers.has(key)) {
      clearTimeout(ttlCache.timers.get(key));
    }
    ttlCache.timers.set(
      key,
      setTimeout(() => ttlCache.delete(key), ttl)
    );
    ttlCache.data.set(key, value);
  },
  get: <T>(key: string) => ttlCache.data.get(key) as T,
  has: (key: string) => ttlCache.data.has(key),
  delete: (key: string) => {
    if (ttlCache.timers.has(key)) {
      clearTimeout(ttlCache.timers.get(key));
    }
    ttlCache.timers.delete(key);
    return ttlCache.data.delete(key);
  },
  clear: () => {
    ttlCache.data.clear();
    for (const v of ttlCache.timers.values()) {
      clearTimeout(v);
    }
    ttlCache.timers.clear();
  }
};
