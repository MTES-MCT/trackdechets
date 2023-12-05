// import { logger } from "@td/logger";
import { clearData } from "./utils/data";

const teardown = async () => {
  console.log("Playwright global-teardown");

  console.log("Cleaning database & cache");
  console.log("DATABASE_URL", process.env.DATABASE_URL);
  await clearData();
};

export default teardown;
