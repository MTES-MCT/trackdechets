import { redisClient } from "../src/common/redis";
import prisma from "../src/prisma";
import { startApolloServer } from "../src/server";
import { client as elasticSearch } from "../src/common/elastic";

beforeAll(async () => {
    await startApolloServer();
});

afterAll(async () => {
  jest.restoreAllMocks();
  await elasticSearch.close();
  await redisClient.quit();
  await prisma.$disconnect();
});
