import { logger } from "@td/logger";
import { cleanUpIsReturnForTab } from "../../common/elasticHelpers";

(async () => {
  try {
    const body = await cleanUpIsReturnForTab();

    logger.info(
      `[cleanUpIsReturnForTab] Update ended! ${body.updated} bsds updated in ${body.took}ms!`
    );
  } catch (error) {
    logger.error("Error in cleanUpIsReturnForTab script, exiting", error);
    throw new Error(`Error in cleanUpIsReturnForTab script : ${error}`);
  }
})();
