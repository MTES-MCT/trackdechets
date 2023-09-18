import { redisClient } from "../src/common/redis";
import prisma from "../src/prisma";
import { client as elasticSearch } from "../src/common/elastic";

beforeAll(async () => {
  // To make mocking possible, don't load the whole app in setup
  const { startApolloServer } = require("../src/server");
  await startApolloServer();
});

afterAll(async () => {
  jest.restoreAllMocks();
  await elasticSearch.close();
  await redisClient.quit();
  await prisma.$disconnect();
});
