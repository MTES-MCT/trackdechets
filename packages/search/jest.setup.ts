import { elasticSearchClient } from "./src/common/elastic";

afterAll(async () => {
  jest.restoreAllMocks();
  await elasticSearchClient.close();
});
