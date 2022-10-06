import { redisClient } from "../src/common/redis";
import prisma from "../src/prisma";
import { startApolloServer } from "../src/server";
import { client as elasticSearch, index } from "../src/common/elastic";
import { declareNewIndex } from "../src/scripts/bin/indexElasticSearch.helpers";

beforeAll(async () => {
  const newIndex = await declareNewIndex(index);
  await elasticSearch.indices.putAlias({
    name: index.alias,
    index: newIndex
  });
  await startApolloServer();
});

afterAll(async () => {
  jest.restoreAllMocks();
  await elasticSearch.close();
  await redisClient.quit();
  await prisma.$disconnect();
});
