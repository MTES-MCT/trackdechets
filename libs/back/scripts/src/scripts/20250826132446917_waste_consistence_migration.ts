import { logger } from "@td/logger";
import { prisma } from "@td/prisma";
import { Prisma } from "@prisma/client";
import { addDays, format, parseISO, isAfter } from "date-fns";

export class WasteConsistenceMigration {
  // CONFIGURATION: Edit these values as needed
  private delayMs = 1000; // Milliseconds between date ranges
  private daysPerRange = 7; // Process records in 7-day chunks (1 week)

  // Date range configuration
  private startDate = "2020-11-29"; // Start processing from this date
  private endDate = "2025-08-28"; // Stop processing at this date

  // TO RESUME: Set this to the "Last Date Range" from the last log message
  // Example: If last log showed "Date Range: 2024-01-15 to 2024-01-22", set this to "2024-01-15"
  private startFromDate: string | null = null; // "2024-01-15"

  async run() {
    logger.info("=== WASTE CONSISTENCE MIGRATION ===");
    logger.info("Converting scalar wasteDetailsConsistence to arrays");
    logger.info(
      `Processing in ${this.daysPerRange}-day chunks with ${this.delayMs}ms delay between ranges`
    );

    // Check if new column exists
    await this.ensureColumnExists();

    const startMsg = this.startFromDate
      ? `Resuming from date: ${this.startFromDate}`
      : `Starting migration from: ${this.startDate}`;
    logger.info(startMsg);
    logger.info(`End date: ${this.endDate}`);
    logger.info(
      `Date range size: ${this.daysPerRange} days, Delay: ${this.delayMs}ms`
    );

    let currentDate = this.startFromDate
      ? parseISO(this.startFromDate)
      : parseISO(this.startDate);
    const endDateParsed = parseISO(this.endDate);
    let totalUpdated = 0;
    let rangeNumber = 0;

    while (!isAfter(currentDate, endDateParsed)) {
      rangeNumber++;

      // Calculate end of current range (add days)
      const rangeEnd = addDays(currentDate, this.daysPerRange);

      // Don't go past the overall end date
      const actualRangeEnd = isAfter(rangeEnd, endDateParsed)
        ? endDateParsed
        : rangeEnd;

      const rangeStart = format(currentDate, "yyyy-MM-dd");
      const rangeEndStr = format(actualRangeEnd, "yyyy-MM-dd");

      logger.info(
        `\n--- Processing Range ${rangeNumber}: ${rangeStart} to ${rangeEndStr} ---`
      );

      // Process all records in this date range at once
      const rangeUpdated = await this.processDateRange(
        currentDate,
        actualRangeEnd
      );
      totalUpdated += rangeUpdated;

      logger.info(
        `Range ${rangeNumber} completed: ${rangeUpdated} records updated`
      );

      // Move to next range
      currentDate = addDays(actualRangeEnd, 7); // Start next range the day after

      // Add delay between ranges
      if (this.delayMs > 0) {
        await this.sleep(this.delayMs);
      }
    }

    logger.info(
      `\nMigration completed! Updated ${totalUpdated} records in ${rangeNumber} date ranges.`
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

  private async processDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    // Update all records within this date range at once
    const result = await prisma.$queryRaw<{ id: string }[]>`
      UPDATE "Form" f
      SET "wasteDetailsConsistence_new" = ARRAY[f."wasteDetailsConsistence"::"Consistence"]
      WHERE f."wasteDetailsConsistence" IS NOT NULL 
      AND f."updatedAt" BETWEEN ${startDate}::date AND ${endDate}::date
      RETURNING f.id
    `;

    return result.length;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export async function run(_tx: Prisma.TransactionClient) {
  await new WasteConsistenceMigration().run();
}
