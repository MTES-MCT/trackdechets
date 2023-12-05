import { logger } from "@td/logger";
import { clearData } from "./utils";

const teardown = async () => {
  logger.info("Playwright global-teardown");

  await clearData();
};

export default teardown;
