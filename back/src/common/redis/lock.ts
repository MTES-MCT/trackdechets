import { redisClient, generateKey } from "./redis";
import { randomBytes } from "crypto";

export interface LockOptions {
  /** Lock expiration time in milliseconds (default: 30000ms = 30s) */
  ttl?: number;
  /** Maximum time to wait for acquiring the lock in milliseconds (default: 5000ms = 5s) */
  timeout?: number;
  /** Retry interval when waiting for lock in milliseconds (default: 100ms) */
  retryInterval?: number;
}

interface AcquiredLock {
  /** Unique identifier for this lock acquisition */
  readonly lockId: string;
  /** The Redis key used for the lock */
  readonly lockKey: string;
  /** Release the lock */
  release: () => Promise<void>;
}

const DEFAULT_OPTIONS: Required<LockOptions> = {
  ttl: 30000, // 30 seconds
  timeout: 5000, // 5 seconds
  retryInterval: 100 // 100ms
};

/**
 * Acquires a distributed lock using Redis.
 * Uses SET with NX and PX options for atomic lock acquisition with TTL.
 * 
 * @param lockName - Name of the lock (will be prefixed with 'lock:')
 * @param options - Lock configuration options
 * @returns Promise<AcquiredLock> - Object containing lock info and release function
 * @throws Error if lock cannot be acquired within timeout period
 * 
 * @example
 * ```typescript
 * const lock = await acquireLock(`user:${userId}:admin-requests`, { ttl: 10000 });
 * try {
 *   // Critical section - only one process can execute this at a time
 *   await doSomeWork();
 * } finally {
 *   await lock.release();
 * }
 * ```
 */
export async function acquireLock(
  lockName: string,
  options: LockOptions = {}
): Promise<AcquiredLock> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  const lockKey = generateKey("lock", lockName);
  const lockId = randomBytes(16).toString("hex"); // Unique identifier for this lock instance
  const startTime = Date.now();

  while (Date.now() - startTime < config.timeout) {
    // Try to acquire the lock atomically
    // SET key value NX PX ttl - Set if Not eXists with expiration in milliseconds
    const result = await redisClient.set(lockKey, lockId, "NX", "PX", config.ttl);
    
    if (result === "OK") {
      // Lock acquired successfully
      return {
        lockId,
        lockKey,
        release: async () => {
          // Use Lua script to safely release lock only if we still own it
          // This prevents accidentally releasing a lock that has expired and been acquired by another process
          const script = `
            if redis.call("GET", KEYS[1]) == ARGV[1] then
              return redis.call("DEL", KEYS[1])
            else
              return 0
            end
          `;
          await redisClient.eval(script, 1, lockKey, lockId);
        }
      };
    }

    // Lock not available, wait before retrying
    await new Promise(resolve => setTimeout(resolve, config.retryInterval));
  }

  throw new Error(`Failed to acquire lock '${lockName}' within ${config.timeout}ms`);
}

/**
 * Executes a function with a distributed lock.
 * Automatically acquires the lock before execution and releases it afterwards.
 * 
 * @param lockName - Name of the lock
 * @param fn - Function to execute while holding the lock
 * @param options - Lock configuration options
 * @returns Promise<T> - Result of the executed function
 * 
 * @example
 * ```typescript
 * const result = await withLock(`user:${userId}:admin-requests`, async () => {
 *   // This code runs exclusively - no other process can run this simultaneously
 *   const count = await countUserRequests(userId);
 *   if (count >= MAX_REQUESTS) throw new Error("Too many requests");
 *   return await createRequest(userId, data);
 * }, { ttl: 10000 });
 * ```
 */
export async function withLock<T>(
  lockName: string,
  fn: () => Promise<T>,
  options: LockOptions = {}
): Promise<T> {
  const lock = await acquireLock(lockName, options);
  try {
    return await fn();
  } finally {
    await lock.release();
  }
}