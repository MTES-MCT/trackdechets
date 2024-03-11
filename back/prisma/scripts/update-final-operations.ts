import { Form } from "@prisma/client";
import { prisma } from "@td/prisma";
import { logger } from "@td/logger";
import { registerUpdater, Updater } from "./helper/helper";
import { FINAL_OPERATION_CODES } from "../../src/common/operationCodes";
import { operationHooksQueue } from "../../src/queue/producers/operationHook";

@registerUpdater(
  "Update FinalOperation table",
  "Update the list of final operation code and quantity in the database",
  false
)
export class UpdateFinalOperationUpdater implements Updater {
  async run() {
    const PAGE_SIZE = 10_000;
    let cursor;
    let processed = 0;
    let finalOperationCodeForms: Pick<Form, "id">[] = [];
    do {
      finalOperationCodeForms = await prisma.form.findMany({
        where: {
          OR: [
            {
              processingOperationDone: {
                in: FINAL_OPERATION_CODES
              }
            },
            {
              noTraceability: true
            }
          ]
        },
        select: {
          id: true
        },
        take: PAGE_SIZE,
        orderBy: {
          id: "asc"
        },
        ...(cursor
          ? {
              skip: 1,
              cursor: {
                id: cursor
              }
            }
          : {})
      });

      if (finalOperationCodeForms.length > 0) {
        logger.info(
          `Processing batch of ${PAGE_SIZE} BSDD - Already finished ${processed}`
        );

        const jobs = finalOperationCodeForms.map(processedForm => ({
          data: {
            finalFormId: processedForm.id,
            initialFormId: processedForm.id
          }
        }));

        await operationHooksQueue.addBulk(jobs);
        cursor = finalOperationCodeForms[finalOperationCodeForms.length - 1].id;
        processed += finalOperationCodeForms.length;
      }
    } while (
      finalOperationCodeForms &&
      finalOperationCodeForms.length === PAGE_SIZE
    );

    logger.info(`Completed update of FinalOperation for ${processed} BSDD`);
    return;
  }
}
