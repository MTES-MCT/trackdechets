import { logger } from "@td/logger";
import { clearData } from "./utils/data";

const teardown = async () => {
  logger.info("Playwright global-teardown");

  logger.info("Cleaning database & cache");
  await clearData();
};

export default teardown;
