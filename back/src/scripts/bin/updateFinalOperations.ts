import { prisma } from "@td/prisma";
import { Form } from "@prisma/client";

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
  const PAGE_SIZE = 100;
  let pageNumber = 0;
  let processed = 0;
  let finalOperationCodeForms: Pick<Form, "id">[] = [];
  do {
    finalOperationCodeForms = await prisma.form.findMany({
      where: {
        processingOperationDone: {
          in: FINAL_OPERATION_CODES
        }
      },
      select: {
        id: true
      },
      take: PAGE_SIZE,
      skip: pageNumber * PAGE_SIZE
    });

    if (finalOperationCodeForms.length > 0) {
      logger.info(
        `Processing page ${pageNumber + 1} with ${
          finalOperationCodeForms.length
        } BSDD`
      );

      const jobs = finalOperationCodeForms.map(processedForm => ({
        data: {
          operationId: processedForm.id,
          formId: processedForm.id
        }
      }));

      await operationHooksQueue.addBulk(jobs);

      processed += finalOperationCodeForms.length;
    }

    pageNumber++;
  } while (
    finalOperationCodeForms &&
    finalOperationCodeForms.length === PAGE_SIZE
  );

  logger.info(`Completed operationHook for ${processed} BSDD`);

  return exitScript();
})();
