import { logger } from "@td/logger";
import { prisma } from "@td/prisma";
import { getUploadWithWritableStream } from "@td/registry";
import { Job } from "bull";
import * as Excel from "exceljs";

import { format as csvFormat } from "@fast-csv/format";

import type { DateFilter, RegistryV2ExportType } from "@td/codegen-back";
import { Upload } from "@aws-sdk/lib-storage";
import { UserInputError } from "../../common/errors";
import { pipeline, Readable } from "stream";
import {
  Prisma,
  RegistryExport,
  RegistryExportFormat,
  RegistryExportStatus
} from "@prisma/client";
import { toWaste } from "../../registryV2/converters";
import { wasteFormatterV2 } from "../../registryV2/streams";
import { EXPORT_COLUMNS } from "../../registryV2/columns";

// we have all verified infos in the registryExport,
// but the date range is a bit more fine in the query than in the object
// so we need to pass it down
export type RegistryExportJobArgs = {
  exportId: string;
  dateRange: DateFilter;
};

const LOOKUP_PAGE_SIZE = 100;

const streamLookup = (
  findManyArgs: Prisma.RegistryLookupFindManyArgs,
  registryType: RegistryV2ExportType,
  addEncounteredSiret: (siret: string) => void
): Readable => {
  let cursorId: string | null = null;
  return new Readable({
    objectMode: true,
    highWaterMark: LOOKUP_PAGE_SIZE * 2,
    async read() {
      try {
        const items = await prisma.registryLookup.findMany({
          ...findManyArgs,
          take: LOOKUP_PAGE_SIZE,
          skip: cursorId ? 1 : 0,
          cursor: cursorId ? { dateId: cursorId } : undefined,
          orderBy: {
            dateId: "asc"
          },
          include: {
            registrySsd: true,
            registryIncomingWaste: true,
            registryIncomingTexs: true,
            bsdd: true,
            bsda: true,
            bsdasri: true,
            bsff: true,
            bspaoh: true,
            bsvhu: true
          }
        });
        for (const item of items) {
          const lookup = item as Prisma.RegistryLookupGetPayload<{
            include: {
              registrySsd: true;
              registryIncomingWaste: true;
              registryIncomingTexs: true;
              bsdd: true;
              bsda: true;
              bsdasri: true;
              bsff: true;
              bspaoh: true;
              bsvhu: true;
            };
          }>;
          addEncounteredSiret(lookup.siret);
          const mapped = toWaste(registryType, {
            SSD: lookup.registrySsd,
            INCOMING_WASTE: lookup.registryIncomingWaste,
            INCOMING_TEXS: lookup.registryIncomingTexs,
            BSDD: lookup.bsdd,
            BSDA: lookup.bsda,
            BSDASRI: lookup.bsdasri,
            BSFF: lookup.bsff,
            BSPAOH: lookup.bspaoh,
            BSVHU: lookup.bsvhu
          });
          if (mapped) {
            this.push(mapped);
          }
        }
        if (items.length < LOOKUP_PAGE_SIZE) {
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
  await prisma.registryExport.updateMany({
    where: { id: exportId },
    data: { status: RegistryExportStatus.FAILED }
  });
}

async function endExport(
  exportId: string,
  siretsEncountered: string[],
  s3FileKey?: string
) {
  const update: Prisma.RegistryExportUpdateArgs["data"] = {
    status: RegistryExportStatus.SUCCESSFUL,
    s3FileKey
  };
  if (siretsEncountered.length > 0) {
    update.sirets = siretsEncountered;
  }
  await prisma.registryExport.update({
    where: { id: exportId },
    data: update
  });
}

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
    const exportType = registryExport.registryType ?? "ALL";
    const columns = EXPORT_COLUMNS[exportType];
    // create s3 file with stream
    const streamInfos = getUploadWithWritableStream({
      bucketName: process.env.S3_REGISTRY_EXPORTS_BUCKET,
      key: `${exportId}${registryExport.format === "CSV" ? ".csv" : ".xlsx"}`,
      contentType:
        registryExport.format === "CSV"
          ? "text/csv"
          : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });
    upload = streamInfos.upload;
    const outputStream = streamInfos.s3Stream;
    //craft the query
    const query: Prisma.RegistryLookupFindManyArgs["where"] = {
      siret: {
        in: registryExport.sirets
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

    // if the export was for all of a user's companies, all the sirets are in the registryExport at the beginning
    // in order to cleanup the exports list, we memorize the
    // sirets that are never encountered during the export, and update the list of sirets
    // in registryExport at the end
    const unusedSirets = new Set(registryExport.sirets);
    const addEncounteredSiret = (siret: string) => {
      unusedSirets.delete(siret);
    };
    const inputStream = streamLookup(
      {
        where: query
      },
      exportType,
      addEncounteredSiret
    );

    // handle CSV exports
    if (registryExport.format === RegistryExportFormat.CSV) {
      const csvStream = csvFormat({
        headers: Object.keys(columns).map(key => columns[key].label),
        delimiter: ";",
        alwaysWriteHeaders: true
      });
      const transformer = wasteFormatterV2({
        exportType,
        useLabelAsKey: true
      });
      pipeline(
        inputStream,
        transformer,
        csvStream,
        outputStream,
        async error => {
          if (error) {
            logger.info(`Error on stream for export ${exportId}`, error);
            await upload?.abort();
            return;
          }
          logger.info(`Finished processing export ${exportId}`, { exportId });
        }
      );

      // handle XLSX exports
    } else {
      const workbook = new Excel.stream.xlsx.WorkbookWriter({
        stream: outputStream
      });
      const worksheet = workbook.addWorksheet("registre");
      const transformer = wasteFormatterV2({
        exportType
      });
      transformer.on("data", waste => {
        if (worksheet.columns === null) {
          // write headers if not present
          worksheet.columns = Object.keys(columns)
            .map(key => ({
              key,
              header: columns[key].label,
              width: 20
            }))
            .filter(Boolean);
        }

        worksheet.addRow(waste, "n").commit();
      });

      transformer.on("end", () => {
        worksheet.commit();
        workbook.commit();
      });
      // output stream event handlers that can't be handled in pipeline
      outputStream.on("finish", async () => {
        logger.info(`Finished processing export ${exportId}`, { exportId });
      });
      outputStream.on("error", async error => {
        logger.info(`Error on output stream for export ${exportId}`, error);
        await upload?.abort();
      });
      pipeline(inputStream, transformer, async error => {
        if (error) {
          logger.info(`Error on stream for export ${exportId}`, error);
          await upload?.abort();
          return;
        }
        logger.info(`Finished processing export ${exportId}`, { exportId });
      });
    }

    // we call upload.done before it's actually "done", because this call
    // actually triggers the flow (in @aws-sdk/lib-storage)
    const result = await upload.done();
    await endExport(
      exportId,
      registryExport.sirets.filter(siret => !unusedSirets.has(siret)),
      result.Key
    );
  } catch (error) {
    logger.error(`Error processing export ${exportId}`, error);
    if (upload) {
      await upload
        .abort()
        .catch(error => logger.error("Upload cannot be aborted", error));
    }
    await failExport(exportId);
  }
}
