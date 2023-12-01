import { logger } from "@td/logger";
import { resetCache, resetDatabase } from "./utils";

const clearData = async () => {
  logger.info("Cleaning database & cache");

  await resetDatabase();
  await resetCache();
};

const teardown = async () => {
  logger.info("Playwright global-teardown");

  await clearData();
};

export default teardown;
