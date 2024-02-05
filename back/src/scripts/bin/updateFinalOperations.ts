import { prisma } from "@td/prisma";
import { closeQueues } from "../../queue/producers";
import { logger } from "@td/logger";
import { FINAL_OPERATION_CODES } from "../../common/operationCodes";
import { operationHooksQueue } from "../../queue/producers/bsdUpdate";

/**
 * Process all FinalOperations of Forms with a FINAL_OPERATION_CODES
 * using the async job queue
 */
async function exitScript() {
  logger.info("Done adding updateFinalOperations job the job queue, exiting");
  await prisma.$disconnect();
  await closeQueues();
  process.exit(0);
}

(async function () {
  const finalOperationCodeForms = await prisma.form.findMany({
    where: {
      processingOperationDone: {
        in: FINAL_OPERATION_CODES
      }
    }
  });
  // TODO paginate
  logger.info(
    `Starting operationHook of BSDS for ${finalOperationCodeForms.length} Companies`
  );
  finalOperationCodeForms.forEach(async processedForm => {
    await operationHooksQueue.add({
      operation: processedForm,
      formId: processedForm.id
    });
  })
  return exitScript();
})();
