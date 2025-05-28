import { PrismaClient } from "@prisma/client";
import { prisma } from "@td/prisma";
import { v7 as uuidv7 } from "uuid";
import { ITXClientDenyList } from "@prisma/client/runtime/library";
import { clearLine, cursorTo } from "readline";
import { performance } from "perf_hooks";

export const generateDateInfos = (date: Date, declaredAt: Date) => ({
  date,
  declaredAt,
  // generate a uuid v7 id
  // using the date as timestamp, so we can sort by this dateId
  // and be in date order with uniqueness
  dateId: uuidv7({
    msecs: date.getTime()
  }),
  declaredAtId: uuidv7({
    msecs: declaredAt.getTime()
  })
});

// cleanup method for cases where the siret could change between updates

// const cleanupPreviousSirets = async (
//   oldRegistryId: string,
//   registryType: RegistryExportType,
//   siretsToKeep: string[],
//   tx: Omit<PrismaClient, ITXClientDenyList>
// ): Promise<void> => {
//   await tx.registryLookup.deleteMany({
//     where: {
//       id: oldRegistryId,
//       exportRegistryType: registryType,
//       siret: { notIn: siretsToKeep }
//     }
//   });
// };

export const deleteRegistryLookup = async (
  id: string,
  tx?: Omit<PrismaClient, ITXClientDenyList>
): Promise<void> => {
  await (tx ?? prisma).registryLookup.deleteMany({
    where: {
      id: id
    }
  });
  return;
};

export class RegistryLogger {
  private lastUpdate: number = Date.now();
  private registryType: string;
  private globalStart: number;
  private processingHistory: { timestamp: number; count: number }[] = [];
  private readonly HISTORY_WINDOW_MS = 5 * 60 * 1000; // 5 minutes in milliseconds

  constructor(registryType: string) {
    this.registryType = registryType;
    this.globalStart = performance.now();
    console.log(`⚙️  [${registryType}] rebuilding registry lookup...`);
  }

  logDelete(): void {
    const deleteTime = performance.now() - this.globalStart;
    console.log(
      `🗑️  [${this.registryType}] Deleted existing lookups in ${Math.round(
        deleteTime
      )}ms`
    );
  }

  private calculateProcessingRate(): { ratePerMinute: number } {
    const now = Date.now();
    // Remove entries older than 5 minutes
    this.processingHistory = this.processingHistory.filter(
      entry => now - entry.timestamp < this.HISTORY_WINDOW_MS
    );

    if (this.processingHistory.length < 2) {
      return { ratePerMinute: 0 };
    }

    const oldestEntry = this.processingHistory[0];
    const newestEntry =
      this.processingHistory[this.processingHistory.length - 1];
    const timeSpanMinutes =
      (newestEntry.timestamp - oldestEntry.timestamp) / (60 * 1000);
    const recordsProcessed = newestEntry.count - oldestEntry.count;

    const ratePerMinute =
      timeSpanMinutes > 0 ? recordsProcessed / timeSpanMinutes : 0;
    return { ratePerMinute };
  }

  logProgress(
    current: number,
    total: number,
    pendingWritesSize?: number
  ): void {
    const now = Date.now();
    if (now - this.lastUpdate > 100) {
      // Update processing history
      this.processingHistory.push({ timestamp: now, count: current });

      const { ratePerMinute } = this.calculateProcessingRate();

      // Ensure current doesn't exceed total for display purposes
      const displayCurrent = Math.min(current, total);
      const percent = Math.round((displayCurrent / total) * 100);
      const progressBar =
        "█".repeat(Math.floor(percent / 2)) +
        "░".repeat(50 - Math.floor(percent / 2));

      clearLine(process.stdout, 0);
      cursorTo(process.stdout, 0);

      const rateDisplay =
        ratePerMinute > 0 ? `(${Math.round(ratePerMinute)} rec/min)` : "";

      // Only show ETA if we haven't exceeded the total
      const remainingRecords = Math.max(0, total - current);
      const estimatedMinutesRemaining =
        ratePerMinute > 0 ? remainingRecords / ratePerMinute : 0;
      const etaDisplay =
        estimatedMinutesRemaining > 0
          ? `ETA: ${Math.round(estimatedMinutesRemaining)}min`
          : "";

      // Add a note if we've processed more than expected
      const overflowNote =
        current > total
          ? ` (processed ${current - total} more than expected)`
          : "";

      // Add pending writes queue size information if provided
      const pendingWritesDisplay =
        pendingWritesSize !== undefined
          ? ` [pending: ${pendingWritesSize}]`
          : "";

      process.stdout.write(
        `⏳ [${this.registryType}] Processing: ${progressBar} ${percent}% (${displayCurrent}/${total})${overflowNote} ${rateDisplay} ${etaDisplay}${pendingWritesDisplay}`
      );
      this.lastUpdate = now;
    }
  }

  logCompletion(processedCount): void {
    const totalTimeSeconds = (performance.now() - this.globalStart) / 1000;
    // Clear the progress bar line
    clearLine(process.stdout, 0);
    cursorTo(process.stdout, 0);
    console.log(
      `✅ [${
        this.registryType
      }] Completed! Processed ${processedCount} records in ${Math.round(
        totalTimeSeconds
      )}s`
    );
  }
}

export const createRegistryLogger = (registryType: string): RegistryLogger => {
  return new RegistryLogger(registryType);
};
