import { logger } from "@td/logger";
import { prisma } from "@td/prisma";
import {
  getUploadWithWritableStream,
  RegistryV2IncomingTexsInclude,
  RegistryV2ManagedInclude,
  RegistryV2OutgoingTexsInclude
} from "@td/registry";
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
import {
  RegistryV2BsdaInclude,
  RegistryV2BsdasriInclude,
  RegistryV2BsddInclude,
  RegistryV2BsffInclude,
  RegistryV2BspaohInclude,
  RegistryV2BsvhuInclude
} from "../../registryV2/types";

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
            registryIncomingTexs: {
              include: RegistryV2IncomingTexsInclude
            },
            registryOutgoingWaste: true,
            registryOutgoingTexs: {
              include: RegistryV2OutgoingTexsInclude
            },
            registryTransported: true,
            registryManaged: {
              include: RegistryV2ManagedInclude
            },
            bsdd: {
              include: RegistryV2BsddInclude
            },
            bsda: {
              include: RegistryV2BsdaInclude
            },
            bsdasri: {
              include: RegistryV2BsdasriInclude
            },
            bsff: {
              include: RegistryV2BsffInclude
            },
            bspaoh: {
              include: RegistryV2BspaohInclude
            },
            bsvhu: {
              include: RegistryV2BsvhuInclude
            }
          }
        });
        for (const lookup of items) {
          addEncounteredSiret(lookup.siret);
          const mapped = toWaste(registryType, lookup.siret, {
            SSD: lookup.registrySsd,
            INCOMING_WASTE: lookup.registryIncomingWaste,
            INCOMING_TEXS: lookup.registryIncomingTexs,
            OUTGOING_WASTE: lookup.registryOutgoingWaste,
            OUTGOING_TEXS: lookup.registryOutgoingTexs,
            TRANSPORTED: lookup.registryTransported,
            MANAGED: lookup.registryManaged,
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
    const exportType = registryExport.registryType;
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

    let condition: Prisma.RegistryLookupWhereInput;
    // if there is a chance that DND BSDs are in the export
    if (
      (!registryExport.wasteTypes?.length ||
        registryExport.wasteTypes.some(wasteType => wasteType === "DND")) && // the user wants DNDs in the export
      registryExport.declarationType !== "REGISTRY" && // the user only wants BSDs in the export
      registryExport.registryType !== "SSD" // the user doesn't want a RNDTS declaration only registry
    ) {
      const companies = await prisma.company.findMany({
        where: {
          orgId: {
            in: registryExport.sirets
          }
        },
        select: {
          orgId: true,
          hasEnabledRegistryDndFromBsdSince: true
        }
      });
      // create a pre-filter that hides DND BSDs pre-hasEnabledRegistryDndFromBsdSince if it's defined for a company
      const orCondition = companies.map(company => {
        if (company.hasEnabledRegistryDndFromBsdSince) {
          return {
            siret: company.orgId,
            OR: [
              {
                declarationType: "REGISTRY"
              },
              {
                wasteType: { in: ["DD", "TEXS"] },
                declarationType: "BSD"
              },
              {
                wasteType: "DND",
                declarationType: "BSD",
                date: {
                  gte: company.hasEnabledRegistryDndFromBsdSince
                }
              }
            ]
          } as Prisma.RegistryLookupWhereInput;
        } else {
          // the company has not enabled DND BSDs, so we always hide them
          return {
            siret: company.orgId,
            OR: [
              {
                declarationType: "REGISTRY"
              },
              {
                wasteType: { in: ["DD", "TEXS"] },
                declarationType: "BSD"
              }
            ]
          } as Prisma.RegistryLookupWhereInput;
        }
      });
      condition = {
        OR: orCondition
      };
    } else {
      // we know this export will not contain DND BSDs, so we don't need a pre-filter
      condition = {
        siret: {
          in: registryExport.sirets
        }
      };
    }
    //craft the query
    const query: Prisma.RegistryLookupWhereInput = {
      ...condition,
      reportAsSiret: registryExport.delegateSiret ?? undefined,
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
