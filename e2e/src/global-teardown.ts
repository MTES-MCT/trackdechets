import { logger } from "@td/logger";
import { clearData } from "./utils";

const teardown = async () => {
  logger.info("Playwright global-teardown");

  logger.error("Cleaning database & cache");
  logger.error("DATABASE_URL", process.env.DATABASE_URL);
  await clearData();
};

export default teardown;
