import { logger } from "@td/logger";
import { prisma } from "@td/prisma";
import { Prisma } from "@prisma/client";

export class WasteConsistenceMigration {
  // CONFIGURATION: Ultra-fast batch processing
  private batchSize = 5000; // Records per batch
  private delayMs = 500; // Milliseconds between batches

  async run() {
    logger.info("=== WASTE CONSISTENCE MIGRATION ===");
    logger.info("Converting scalar wasteDetailsConsistence to arrays");
    logger.info("Using ultra-fast batch processing approach");

    // Check if new column exists
    await this.ensureColumnExists();

    logger.info(`Batch size: ${this.batchSize}, Delay: ${this.delayMs}ms`);

    let batchNumber = 0;
    let totalUpdated = 0;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      batchNumber++;

      // Process one batch
      const result = await this.processBatch();

      if (result.updated === 0) {
        logger.info("No more records to process. Migration complete!");
        break;
      }

      totalUpdated += result.updated;

      logger.info(
        `Batch ${batchNumber}: Updated ${result.updated} records ` +
          `(Total: ${totalUpdated})`
      );

      // Add delay between batches to reduce database load
      if (this.delayMs > 0) {
        await this.sleep(this.delayMs);
      }

      // Safety check for runaway migrations
      if (batchNumber > 100000) {
        logger.warn("Processed 100,000 batches. Stopping as safety measure.");
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

  private async processBatch(): Promise<{ updated: number }> {
    // Ultra-fast batch processing - no ordering, no pagination
    // Just grabs the first N records that need updating
    const result = await prisma.$queryRaw<{ id: string }[]>`
      UPDATE "Form" 
      SET "wasteDetailsConsistence_new" = ARRAY["wasteDetailsConsistence"::"Consistence"]
      WHERE ctid IN (
        SELECT ctid 
        FROM "Form" 
        WHERE "wasteDetailsConsistence" IS NOT NULL 
        AND "wasteDetailsConsistence_new" IS NULL
        LIMIT ${this.batchSize}
      )
      RETURNING id
    `;

    return {
      updated: result.length
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export async function run(_tx: Prisma.TransactionClient) {
  await new WasteConsistenceMigration().run();
}
