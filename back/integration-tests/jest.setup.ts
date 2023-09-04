import { redisClient } from "../src/common/redis";
import prisma from "../src/prisma";
import { startApolloServer } from "../src/server";
import { client as elasticSearch } from "../src/common/elastic";
import { closeMongoClient } from "../src/events/mongodb";
import { closeQueues } from "../src/queue/producers";

beforeAll(async () => {
  await startApolloServer();
});

afterAll(async () => {
  jest.restoreAllMocks();
  await closeMongoClient();
  await closeQueues();
  await elasticSearch.close();
  await redisClient.quit();
  await prisma.$disconnect();
});
