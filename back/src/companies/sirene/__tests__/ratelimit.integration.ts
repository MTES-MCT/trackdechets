import { throttle } from "../ratelimit";
import { resetCache } from "../../../../integration-tests/helper";
import { redisClient, setInCache } from "../../../common/redis";

describe("throttled decorator", () => {
  afterEach(() => resetCache());

  it("should throttle API call when hitting 429", async () => {
    expect.assertions(6);

    // function to be throttled
    const fn = jest.fn();
    const cacheKey = "throttle_test";
    const errorMessage = "Out of quotas";

    // check throttle key is not set in redis initially
    const isThrottledInitially = await redisClient.get(cacheKey);
    expect(isThrottledInitially).toBeNull();

    fn.mockRejectedValueOnce({ response: { status: 429 } });

    // decorates function
    const throttled = throttle<{ status: number }>(fn, {
      cacheKey,
      errorMessage
    });

    try {
      await throttled("siret");
    } catch (err) {
      expect(err.message).toEqual(errorMessage);
    }

    // check throttle key is set in redis
    const isThrottled = await redisClient.get(cacheKey);
    expect(isThrottled).toEqual("true");

    // subsequent calls should fail fast and not hit fn
    fn.mockClear();
    try {
      await throttled("siret");
    } catch (err) {
      expect(err.message).toEqual(errorMessage);
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
