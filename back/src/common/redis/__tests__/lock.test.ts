import { acquireLock, withLock } from "../lock";
import { redisClient } from "../redis";

// Mock Redis client for testing
jest.mock("../redis", () => ({
  redisClient: {
    set: jest.fn(),
    eval: jest.fn()
  },
  generateKey: jest.fn((prefix, name) => `${prefix}:${name}`)
}));

const mockedRedisClient = redisClient as jest.Mocked<{
  set: jest.MockedFunction<any>;
  eval: jest.MockedFunction<any>;
}>;

describe("Redis Distributed Lock", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("acquireLock", () => {
    it("should acquire lock successfully when available", async () => {
      mockedRedisClient.set.mockResolvedValue("OK");

      const lock = await acquireLock("test-resource");

      expect(mockedRedisClient.set).toHaveBeenCalledWith(
        "lock:test-resource",
        expect.any(String), // lockId
        "NX",
        "PX",
        30000 // default TTL
      );
      expect(lock.lockKey).toBe("lock:test-resource");
      expect(typeof lock.release).toBe("function");
    });

    it("should throw error when lock cannot be acquired within timeout", async () => {
      mockedRedisClient.set.mockResolvedValue(null); // Lock not available

      const promise = acquireLock("busy-resource", { timeout: 200, retryInterval: 50 });

      await expect(promise).rejects.toThrow(
        "Failed to acquire lock 'busy-resource' within 200ms"
      );
    });

    it("should use custom options when provided", async () => {
      mockedRedisClient.set.mockResolvedValue("OK");

      await acquireLock("test-resource", { ttl: 5000 });

      expect(mockedRedisClient.set).toHaveBeenCalledWith(
        "lock:test-resource",
        expect.any(String),
        "NX",
        "PX",
        5000 // custom TTL
      );
    });
  });

  describe("withLock", () => {
    it("should execute function with lock protection", async () => {
      mockedRedisClient.set.mockResolvedValue("OK");
      mockedRedisClient.eval.mockResolvedValue(1);

      const mockFn = jest.fn().mockResolvedValue("result");

      const result = await withLock("test-resource", mockFn);

      expect(result).toBe("result");
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockedRedisClient.set).toHaveBeenCalled(); // Lock acquired
      expect(mockedRedisClient.eval).toHaveBeenCalled(); // Lock released
    });

    it("should release lock even if function throws", async () => {
      mockedRedisClient.set.mockResolvedValue("OK");
      mockedRedisClient.eval.mockResolvedValue(1);

      const mockFn = jest.fn().mockRejectedValue(new Error("Function failed"));

      await expect(withLock("test-resource", mockFn)).rejects.toThrow("Function failed");

      expect(mockedRedisClient.eval).toHaveBeenCalled(); // Lock still released
    });
  });
});