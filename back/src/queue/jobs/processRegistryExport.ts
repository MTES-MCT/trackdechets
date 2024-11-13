import { logger } from "@td/logger";
import { prisma } from "@td/prisma";
import { getUploadWithWritableStream } from "@td/registry";
import { Job } from "bull";
import * as Excel from "exceljs";

import { format as csvFormat } from "@fast-csv/format";

import { DateFilter, WasteRegistryType } from "@td/codegen-back";
import { Upload } from "@aws-sdk/lib-storage";
import { UserInputError } from "../../common/errors";
import { Readable } from "stream";
import {
  Prisma,
  RegistryExport,
  RegistryExportFormat,
  RegistryExportStatus
} from "@prisma/client";
import { toWaste } from "../../registry/converters";
import { wasteFormatter } from "../../registry/streams";
import { getXlsxHeaders } from "../../registry/columns";
import { exportOptions } from "@td/registry";
// we have all verified infos in the registryExport,
// but the date range is a bit more fine in the query than in the object
// so we need to pass it down
export type RegistryExportJobArgs = {
  exportId: string;
  dateRange: DateFilter;
};

const streamLookup = (
  findManyArgs: Prisma.RegistryLookupFindManyArgs,
  registryType: WasteRegistryType
): Readable => {
  let cursorId: string | null = null;
  let count = 0;
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
            dateId: "asc"
          },
          include: {
            registrySsd: true
          }
        });
        for (const item of items) {
          const lookup = item as Prisma.RegistryLookupGetPayload<{
            include: { registrySsd: true };
          }>;
          // console.log(lookup);
          const mapped = toWaste(registryType, {
            SSD: lookup.registrySsd
          });
          if (mapped) {
            this.push(mapped);
          }
        }
        if (items.length < 100) {
          console.log("PUSH NULL");
          this.push(null);
          return;
        }
        count += items.length;
        if (count % 10000 === 0) {
          console.log("count", count);
        }
        cursorId = items[items.length - 1].dateId;
      } catch (err) {
        this.destroy(err);
      }
    }
  });
};

async function startExport(exportId: string): Promise<RegistryExport | null> {
  try {
    const registryExport = await prisma.registryExport.update({
      where: { id: exportId, status: RegistryExportStatus.PENDING },
      data: { status: RegistryExportStatus.STARTED }
    });
    return registryExport;
  } catch {
    return null;
  }
}

async function failExport(exportId: string) {
  await prisma.registryExport.update({
    where: { id: exportId },
    data: { status: RegistryExportStatus.FAILED }
  });
}

async function endExport(exportId: string, s3FileKey?: string) {
  await prisma.registryExport.update({
    where: { id: exportId },
    data: { status: RegistryExportStatus.SUCCESSFUL, s3FileKey }
  });
}

export async function processRegistryExportJob(
  job: Job<RegistryExportJobArgs>
) {
  const { exportId, dateRange } = job.data;
  let upload: Upload | null = null;
  console.log("AQUI");

  try {
    const registryExport = await startExport(exportId);
    if (!registryExport) {
      throw new UserInputError(`L'export ${exportId} est introuvable`);
    }
    const { headers } = exportOptions[registryExport.registryType ?? "ALL"];
    // create s3 file with stream
    const streamInfos = getUploadWithWritableStream(
      process.env.S3_REGISTRY_EXPORTS_BUCKET!,
      `${exportId}${registryExport.format === "CSV" ? ".csv" : ".xlsx"}`,
      registryExport.format === "CSV"
        ? "text/csv"
        : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    upload = streamInfos.upload;
    const outputStream = streamInfos.s3Stream;
    //query with cursor
    const query: Prisma.RegistryLookupFindManyArgs["where"] = {
      sirets: {
        hasSome: registryExport.sirets
      },
      reportAsSirets: registryExport.delegateSiret
        ? {
            has: registryExport.delegateSiret
          }
        : undefined,
      exportRegistryType: registryExport.registryType ?? undefined,
      wasteType: registryExport.wasteTypes?.length
        ? {
            in: registryExport.wasteTypes
          }
        : undefined,
      wasteCode: registryExport.wasteCodes?.length
        ? {
            in: registryExport.wasteCodes
          }
        : undefined,
      declarationType: registryExport.declarationType ?? undefined,
      date: {
        lt: dateRange._lt ?? undefined,
        lte: dateRange._lte ?? undefined,
        equals: dateRange._eq ?? undefined,
        gt: dateRange._gt ?? undefined,
        gte: dateRange._gte ?? undefined
      }
    };
    console.log(JSON.stringify(query, null, 2));

    const inputStream = streamLookup(
      {
        where: query
      },
      registryExport.registryType ?? "ALL"
    );
    inputStream.on("end", () => {
      console.log("There will be no more data.");
    });
    outputStream.on("end", () => {
      console.log("output stream ended");
    });
    outputStream.on("finish", async () => {
      logger.info(`Finished processing export ${exportId}`, { exportId });
    });
    outputStream.on("error", async error => {
      logger.error(`Error processing export ${exportId}`, error);
      await upload?.abort();
      await failExport(exportId);
    });

    if (registryExport.format === RegistryExportFormat.CSV) {
      const csvStream = csvFormat({
        headers: true,
        delimiter: ";",
        alwaysWriteHeaders: true
      });
      csvStream.on("end", () => {
        console.log("csv stream ended.");
      });
      csvStream.on("finish", () => {
        console.log("csv stream finished.");
      });
      csvStream.on("error", e => {
        console.log(e);

        console.log("csv stream error.");
      });
      const transformer = wasteFormatter({
        useLabelAsKey: false,
        columnSorter: (line: Record<string, string>) => {
          return Object.fromEntries(
            Object.keys(headers).map(key => [headers[key], line[key]])
          );
        }
      });
      inputStream.pipe(transformer).pipe(csvStream).pipe(outputStream);
    } else {
      const workbook = new Excel.stream.xlsx.WorkbookWriter({
        stream: outputStream
      });
      const worksheet = workbook.addWorksheet("registre");
      const transformer = wasteFormatter({
        useLabelAsKey: false,
        columnSorter: (line: Record<string, string>) => {
          return Object.fromEntries(
            Object.keys(headers).map(key => [key, line[key]])
          );
        }
      });
      inputStream.pipe(transformer);
      transformer.on("data", waste => {
        if (worksheet.columns === null) {
          // write headers if not present
          const columns = getXlsxHeaders(waste);
          worksheet.columns = Object.keys(headers)
            .map(key => columns.find(col => col.key === key))
            .filter(Boolean);
        }

        worksheet.addRow(waste, "n").commit();
      });

      transformer.on("end", () => {
        worksheet.commit();
        workbook.commit();
      });
    }
    upload.on("httpUploadProgress", progress => {
      console.log(progress);
    });
    const result = await upload.done();
    await endExport(exportId, result?.Key);
  } catch (error) {
    logger.error(`Error processing export ${exportId}`, error);
    if (upload) {
      await upload.abort();
      await failExport(exportId);
    }
  }
}
