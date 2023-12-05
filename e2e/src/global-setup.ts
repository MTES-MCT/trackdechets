// import { logger } from "@td/logger";

const setup = async () => {
  console.log("Playwright global-setup");
  console.log("DATABASE_URL", process.env.DATABASE_URL);
};

export default setup;
