import { prisma } from "@td/prisma";
import { closeQueues } from "../../queue/producers";
import { cleanUpIsReturnForTab } from "../../common/elasticHelpers";

async function exitScript(success?: boolean) {
  await prisma.$disconnect();
  console.log(
    success
      ? "Done, exiting"
      : "L'argument ne correspond pas à un ID ou readableId de bsd"
  );
  await closeQueues();
}

(async function () {
  console.log("--------");
  const r = await cleanUpIsReturnForTab(
    "bsds_v1.1.2_dev_2024-10-13t13===22===14.778z"
  );
  console.log(r);
  await exitScript();
})();
