import { redisClient } from "./src/common/redis";

afterAll(async () => {
  jest.restoreAllMocks();
  await redisClient.quit();
});
