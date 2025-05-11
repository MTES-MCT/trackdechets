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

  logProgress(current: number, total: number): void {
    const now = Date.now();
    if (now - this.lastUpdate > 100) {
      const percent = Math.round((current / total) * 100);
      const progressBar =
        "█".repeat(Math.floor(percent / 2)) +
        "░".repeat(50 - Math.floor(percent / 2));
      clearLine(process.stdout, 0);
      cursorTo(process.stdout, 0);
      process.stdout.write(
        `⏳ [${this.registryType}] Processing: ${progressBar} ${percent}% (${current}/${total})`
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
