import { backoffIfTooManyRequests, throttle } from "../ratelimit";
import { resetCache } from "../../../../integration-tests/helper";
import { redisClient, setInCache } from "../../../common/redis";

describe("backoff decorator", () => {
  afterEach(() => resetCache());

  it("should throttle API call when hitting 429", async () => {
    expect.assertions(6);

    // function to be throttled
    const fn = jest.fn();
    const service = "insee";
    const cacheKey = `${service}_backoff`;

    // check throttle key is not set in redis initially
    const isThrottledInitially = await redisClient.get(cacheKey);
    expect(isThrottledInitially).toBeNull();

    fn.mockRejectedValueOnce({ response: { status: 429 } });

    // decorates function
    const throttled = backoffIfTooManyRequests<{ status: number }>(fn, {
      service
    });

    try {
      await throttled("siret");
    } catch (err) {
      expect(err.message).toEqual("Trop de requêtes sur l'API Sirene insee");
    }

    // check throttle key is set in redis
    const isThrottled = await redisClient.get(cacheKey);
    expect(isThrottled).toEqual("true");

    // subsequent calls should fail fast and not hit fn
    fn.mockClear();
    try {
      await throttled("siret");
    } catch (err) {
      expect(err.message).toEqual("Trop de requêtes sur l'API Sirene insee");
    }
    expect(fn).not.toHaveBeenCalled();

    // expires throttle key after 1 second
    await setInCache(cacheKey, "true", { EX: 1 });

    // wait for the throttle period to expires
    await new Promise<void>(resolve => setTimeout(() => resolve(), 1500));

    fn.mockResolvedValueOnce({ status: 200 });

    // it should make request normally after the throttled period
    const response = await throttled("siret");
    expect(response.status).toEqual(200);
  });
});

describe("throttle decorator", () => {
  const RealDate = Date;

  function mockDate(millis) {
    Date.now = jest.fn(() => millis) as jest.Mock;
  }

  afterEach(async () => {
    await resetCache();
    Date = RealDate;
  });

  it("should not allow more than x requests per frame of 1 second", async () => {
    const now = 1643185805490;
    mockDate(now);
    const fn = jest.fn().mockResolvedValue({ status: 200 });
    const throttled = throttle(fn, { service: "insee", requestsPerSeconds: 2 });
    // 2 requests per seconds are allowed, let's make 3
    await expect(throttled()).resolves.toEqual({ status: 200 });
    await expect(throttled()).resolves.toEqual({ status: 200 });
    await expect(throttled()).rejects.toThrow(
      "Trop de requêtes sur l'API Sirene insee"
    );
    // check redis counter for this second is equal to 3
    const secondsSinceEpoch = Math.round(now / 1000);
    const cacheKey = `insee_throttle_${secondsSinceEpoch}`;
    const counter = await redisClient.get(cacheKey);
    expect(counter).toEqual("3");
    // fn should have been called only two times
    expect(fn).toHaveBeenCalledTimes(2);

    // throttled should be reset the next second
    mockDate(now + 1000);
    await expect(throttled()).resolves.toEqual({ status: 200 });

    // check redis key is cleared after 1 second
    await new Promise(resolve => setTimeout(resolve, 1000));
    await expect(redisClient.get(cacheKey)).resolves.toBeNull();
  });
});
