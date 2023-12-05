import { logger } from "@td/logger";

const setup = async () => {
  logger.error("Playwright global-setup");
};

export default setup;
