import { Prisma, PrismaClient } from "@td/prisma";
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
  private segmentSpeeds: number[] = Array(50).fill(0);
  private maxSpeed = 0;
  private hasResetMaxSpeed = false;

  // Color codes for red to green gradient
  private readonly COLOR_CODES = [
    196, 202, 208, 214, 220, 226, 190, 154, 118, 82, 46
  ];

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

  private getColorForSpeed(speed: number): string {
    if (this.maxSpeed === 0) return "\x1b[38;5;196m"; // Bright red for 0 speed

    const ratio = speed / this.maxSpeed;
    // Map ratio to color codes (0-10)
    const colorIndex = Math.min(
      Math.floor(ratio * (this.COLOR_CODES.length - 1)),
      this.COLOR_CODES.length - 1
    );
    return `\x1b[38;5;${this.COLOR_CODES[colorIndex]}m`;
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

      // Calculate current segment and update its speed
      const currentSegment = Math.floor(percent / 2);
      if (currentSegment < 50) {
        this.segmentSpeeds[currentSegment] = ratePerMinute;

        // Reset maxSpeed after first segment is completed
        if (currentSegment === 1 && !this.hasResetMaxSpeed) {
          this.maxSpeed = this.segmentSpeeds[0];
          this.hasResetMaxSpeed = true;
        } else {
          this.maxSpeed = Math.max(this.maxSpeed, ratePerMinute);
        }
      }

      // Create progress bar with color-coded filled squares and empty squares
      const filledCount = Math.floor(percent / 2);
      const progressBar = Array(50)
        .fill("")
        .map((_, index) => {
          if (index < filledCount) {
            const color = this.getColorForSpeed(this.segmentSpeeds[index]);
            return `${color}█\x1b[0m`;
          } else if (index === currentSegment) {
            const color = this.getColorForSpeed(ratePerMinute);
            return `${color}█\x1b[0m`;
          }
          return "░";
        })
        .join("");

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

    // Create the final progress bar with all segments colored
    const progressBar = this.segmentSpeeds
      .map(speed => {
        const color = this.getColorForSpeed(speed);
        return `${color}█\x1b[0m`;
      })
      .join("");

    console.log(
      `✅ [${
        this.registryType
      }] Completed! Processed ${processedCount} records in ${Math.round(
        totalTimeSeconds
      )}s\n🚀 [${this.registryType}] Final speed profile: ${progressBar}`
    );
  }
}

export const createRegistryLogger = (registryType: string): RegistryLogger => {
  return new RegistryLogger(registryType);
};

export const rebuildRegistryLookupGeneric =
  <T extends { id: string }>({
    name,
    getTotalCount,
    toLookupData,
    findMany
  }: {
    name: string;
    getTotalCount: () => Promise<number>;
    findMany: (pageSize: number, cursorId: string | null) => Promise<T[]>;
    toLookupData: (items: T[]) => Prisma.RegistryLookupUncheckedCreateInput[];
  }) =>
  async (pageSize = 100, threads = 4) => {
    const logger = createRegistryLogger(name);

    // First, get total count for progress calculation
    const total = await getTotalCount();

    let done = false;
    let cursorId: string | null = null;
    let processedCount = 0;
    let operationId = 0;
    const pendingWrites = new Map<number, Promise<void>>();

    const processWrite = async (items: T[]) => {
      const createArray = toLookupData(items);
      // Run delete and create operations in a transaction
      await prisma.$transaction(
        async tx => {
          // Delete existing lookups for these items
          await tx.registryLookup.deleteMany({
            where: {
              OR: items.map(item => ({
                id: item.id
              }))
            }
          });

          await tx.registryLookup.createMany({
            data: createArray,
            skipDuplicates: true
          });
        },
        {
          maxWait: 20000,
          timeout: 60000
        }
      );

      processedCount += items.length;
      logger.logProgress(processedCount, total, pendingWrites.size);
    };

    while (!done) {
      // Sequential read
      const items = await findMany(pageSize, cursorId);

      // Start the write operation
      const currentOperationId = operationId++;
      const writePromise = processWrite(items).finally(() => {
        pendingWrites.delete(currentOperationId);
      });
      pendingWrites.set(currentOperationId, writePromise);

      // If we've reached max concurrency, wait for one write to complete
      if (pendingWrites.size >= threads) {
        await Promise.race(pendingWrites.values());
      }

      if (items.length < pageSize) {
        done = true;
        break;
      }
      cursorId = items[items.length - 1].id;
    }

    // Wait for any remaining writes to complete
    if (pendingWrites.size > 0) {
      await Promise.all(pendingWrites.values());
    }

    logger.logCompletion(processedCount);
  };
