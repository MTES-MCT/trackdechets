// eslint-disable-next-line
import { resetCaches } from "graphql-tag";
import logger from "./logging/logger";

const GQL_CLEANUP_INTERVAL = 1000 * 60 * 60;

export function cleanGqlCaches() {
  resetCaches();
  logger.info("MEM TMP - Cleaned gql cache");
  setTimeout(cleanGqlCaches, GQL_CLEANUP_INTERVAL);
}
