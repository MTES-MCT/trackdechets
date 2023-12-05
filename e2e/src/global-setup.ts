// import { logger } from "@td/logger";

const setup = async () => {
  console.log("Playwright global-setup");
  console.log("DATABASE_URL", process.env.DATABASE_URL);
  console.log("API_HOST", process.env.API_HOST);
};

export default setup;
