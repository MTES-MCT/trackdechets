import { logger } from "@td/logger";

const setup = async () => {
  logger.info("Playwright global-setup");
  logger.info("Database: ", process.env.DATABASE_URL);
};

export default setup;
