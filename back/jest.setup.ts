import { redisClient } from "./src/common/redis";
import { closeMongoClient } from "./src/events/mongodb";

afterAll(async () => {
  jest.restoreAllMocks();
  await closeMongoClient();
  await redisClient.quit();
});
