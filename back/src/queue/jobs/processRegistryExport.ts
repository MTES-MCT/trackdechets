import { logger } from "@td/logger";
import { prisma } from "@td/prisma";
import {
  getFileMetadata,
  getFileAsStream,
  getUploadWithWritableStream,
  ImportType,
  processStream,
  setFileAsNotTemporary
} from "@td/registry";
import { Job } from "bull";

import { getUserCompanies } from "../../users/database";
import {
  DateFilter,
  FormsRegisterExportFormat,
  WasteRegistryType,
  WasteRegistryV2Where
} from "../../generated/graphql/types";
import {
  endExport,
  failExport,
  startExport
} from "libs/back/registry/src/database";
import { Upload } from "@aws-sdk/lib-storage";
import { UserInputError } from "../../common/errors";
import { Readable } from "stream";
import { Prisma } from "@prisma/client";

// we have all verified infos in the registryExport,
// but the date range is a bit more fine in the query than in the object
// so we need to pass it down
export type RegistryExportJobArgs = {
  exportId: string;
  dateRange: DateFilter;
};

const streamLookup = (
  findManyArgs: Prisma.RegistryLookupFindManyArgs
): Readable => {
  let cursorId: string | null = null;
  return new Readable({
    objectMode: true,
    highWaterMark: 200,
    async read() {
      try {
        const items = await prisma.registryLookup.findMany({
          ...findManyArgs,
          take: 100,
          skip: cursorId ? 1 : 0,
          cursor: cursorId ? { dateId: cursorId } : undefined,
          orderBy: {
            dateId: "desc"
          },
          include: {
            registrySsd: true
          }
        });
        for (const item of items) {
          this.push(item);
        }
        if (items.length < 100) {
          this.push(null);
          return;
        }
        cursorId = items[items.length - 1].dateId;
      } catch (err) {
        this.destroy(err);
      }
    }
  });
};

export async function processRegistryExportJob(
  job: Job<RegistryExportJobArgs>
) {
  const { exportId, dateRange } = job.data;
  let upload: Upload | null = null;
  try {
    const registryExport = await startExport(exportId);
    if (!registryExport) {
      throw new UserInputError(`L'export ${exportId} est introuvable`);
    }

    // create s3 file with stream
    const streamInfos = getUploadWithWritableStream(
      process.env.S3_REGISTRY_EXPORTS_BUCKET!,
      `${exportId}.csv`
    );
    upload = streamInfos.upload;
    const outputStream = streamInfos.s3Stream;
    //query with cursor
    const query: Prisma.RegistryLookupFindManyArgs = {};

    for await (const registryLookup of streamLookup(query)) {
      console.log(user);
    }
    // loop with cursor
    // mapping
    // write to stream

    const result = await upload.done();
    await endExport(exportId, result.Key);
  } catch (error) {
    logger.error(`Error processing export ${exportId}`, error);
    if (upload) {
      await upload.abort();
      await failExport(exportId);
    }
  }

  logger.info(`Finished processing export ${exportId}`, { exportId });
}
