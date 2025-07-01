import { cleanUpIsReviewedRevisionForTab } from "../../common/elasticHelpers";

/**
 * This script should never be needed as there is a cron job to
 * accomplish the cleanup, but it's nice to have a backup in case
 * we need to manually trigger it.
 */
(async function () {
  console.log("Starting cleanUpIsReviewedRevisionForTab script!");

  await cleanUpIsReviewedRevisionForTab();

  console.log("Done!");
})().then(() => process.exit());
