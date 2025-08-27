import { logger } from "@td/logger";
import { prisma } from "@td/prisma";
import { Prisma } from "@prisma/client";

export class WasteConsistenceMigration {
  // CONFIGURATION: Edit these values as needed
  private batchSize = 50000;
  private delayMs = 200; // 2 seconds between batches

  // TO RESUME: Set this to the "Last ID" from the last log message
  // Example: If last log showed "Last ID: 123456", set this to "123456"
  private startFromId = "1";

  async run() {
    logger.info("=== WASTE CONSISTENCE MIGRATION ===");
    logger.info("Converting scalar wasteDetailsConsistence to arrays");

    // Check if new column exists
    await this.ensureColumnExists();

    logger.info(`Starting migration from ID: ${this.startFromId}`);
    logger.info(`Batch size: ${this.batchSize}, Delay: ${this.delayMs}ms`);

    let currentId: string = this.startFromId;
    let batchNumber = 0;
    let totalUpdated = 0;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      batchNumber++;

      // Process one batch
      const result = await this.processBatch(currentId);

      if (result.updated === 0) {
        logger.info("No more records to process. Migration complete!");
        break;
      }

      totalUpdated += result.updated;
      currentId = result.lastProcessedId;

      logger.info(
        `Batch ${batchNumber}: Updated ${result.updated} records ` +
          `(Total: ${totalUpdated}, Last ID: ${result.lastProcessedId})`
      );

      // Add delay between batches to reduce database load
      if (this.delayMs > 0) {
        await this.sleep(this.delayMs);
      }

      // Safety check for runaway migrations
      if (batchNumber > 100000) {
        logger.warn("Processed 100,000 batches. Stopping as safety measure.");
        logger.info(
          `To continue, edit startFromId to "${currentId}" and restart the script`
        );
        break;
      }
    }

    logger.info(
      `Migration completed! Updated ${totalUpdated} records in ${batchNumber} batches.`
    );
  }

  private async ensureColumnExists() {
    try {
      // Try to select from the new column to see if it exists
      await prisma.$queryRaw`SELECT "wasteDetailsConsistence_new" FROM "Form" LIMIT 1`;
      logger.info("Column wasteDetailsConsistence_new already exists");
    } catch (_error) {
      logger.info("Creating wasteDetailsConsistence_new column...");
      await prisma.$executeRaw`ALTER TABLE "Form" ADD COLUMN "wasteDetailsConsistence_new" "Consistence"[]`;
      logger.info("Column wasteDetailsConsistence_new created successfully");
    }
  }

  private async processBatch(
    startId: string
  ): Promise<{ updated: number; lastProcessedId: string }> {
    // Use >= for first batch (startFromId), > for subsequent batches
    const isFirstBatch = startId === this.startFromId;
    const operator = isFirstBatch ? ">=" : ">";

    // UPDATE with subquery to handle ORDER BY and LIMIT
    const result = await prisma.$queryRaw<{ id: string }[]>`
      UPDATE "Form" 
      SET "wasteDetailsConsistence_new" = ARRAY["wasteDetailsConsistence"::"Consistence"]
      WHERE id IN (
        SELECT id 
        FROM "Form" 
        WHERE id ${Prisma.raw(operator)} ${startId}
        AND "wasteDetailsConsistence" IS NOT NULL 
        ORDER BY id ASC 
        LIMIT ${this.batchSize}
      )
      RETURNING id
    `;
    const updatedCount = result.length;

    // Find the maximum ID from the returned results (since RETURNING doesn't support ORDER BY)
    const lastProcessedId =
      result.length > 0
        ? result.reduce(
            (maxId, current) => (current.id > maxId ? current.id : maxId),
            result[0].id
          )
        : startId;
    return {
      updated: updatedCount,
      lastProcessedId
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export async function run(_tx: Prisma.TransactionClient) {
  await new WasteConsistenceMigration().run();
}
