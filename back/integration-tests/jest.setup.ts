import { redisClient } from "../src/common/redis";
import prisma from "../src/prisma";
import { startApolloServer } from "../src/server";
import { elasticSearchClient } from "@trackdechets/common";

beforeAll(async () => {
  await startApolloServer();
});

afterAll(async () => {
  jest.restoreAllMocks();
  await elasticSearchClient.close();
  await redisClient.quit();
  await prisma.$disconnect();
});
