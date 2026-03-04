import { logger } from "@td/logger";
import { CompanyType, prisma, WasteProcessorType } from "@td/prisma";
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
import { addAbortSignal, pipeline, Readable } from "stream";
import {
  Prisma,
  RegistryExport,
  RegistryExportFormat,
  RegistryExportStatus
} from "@td/prisma";
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

async function isExportCanceled(exportId: string) {
  const registryExport = await prisma.registryExport.findUnique({
    where: { id: exportId },
    select: { status: true }
  });
  return registryExport?.status === RegistryExportStatus.CANCELED;
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
  let cancelledByUser = false;
  let clearCancelCheck: () => void = () => {
    /* assigned before use */
  };

  try {
    const registryExport = await startExport(exportId);
    if (!registryExport) {
      if (await isExportCanceled(exportId)) {
        return;
      }
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
    /**
     * Filtering logic for DND (Non-Dangerous Waste) BSDs in regulatory registry exports.
     *
     * 1. If a company has NOT activated the DND traceability option (hasEnabledRegistryDndFromBsdSince is null):
     *    - No DND BSDs appear in regulatory registries for that company
     *    - DD (Dangerous Waste) and dangerous TEXS (waste codes 17 05 05*, 17 05 03*) BSDs can still appear
     *    - REGISTRY declarations always appear
     *
     * 2. If a company HAS activated the DND traceability option (hasEnabledRegistryDndFromBsdSince is set):
     *    a. non-dangerous TEXS BSDs (waste codes 17 05 04, 17 05 06, 20 02 02):
     *       - Always appear in regulatory registries, regardless of company profile type
     *       - Only for BSDs dated on or after the activation date (hasEnabledRegistryDndFromBsdSince)
     *
     *    b. DND BSDs (other non-dangerous waste codes):
     *       - Only appear if the company has at least one of these waste processor sub-profiles:
     *         * "Incinération de déchets non dangereux" (Non-dangerous waste incineration) WASTEPROCESSOR + NON_DANGEROUS_WASTES_INCINERATION
     *         * "Installation de stockage de déchets non dangereux" (Non-dangerous waste storage) WASTEPROCESSOR + NON_DANGEROUS_WASTES_STORAGE
     *         * "Installation dans laquelle les déchets perdent leur statut de déchet" RECOVERY_FACILITY
     *       - Only appear for BSDs dated on or after the activation date (hasEnabledRegistryDndFromBsdSince)
     *       - If the company doesn't have these profiles, DND BSDs are excluded even if the option is enabled
     *
     * This filter is only applied when:
     * - The export may contain DND waste types (no wasteTypes filter OR DND is included)
     * - The export is not REGISTRY-only (declarationType !== "REGISTRY")
     * - The export is not SSD type (registryType !== "SSD", as SSD exports don't contain BSDs)
     */

    if (
      // if there is a chance that DND BSDs are in the export
      (!registryExport.wasteTypes?.length ||
        registryExport.wasteTypes.some(
          wasteType => wasteType === "DND" || wasteType === "TEXS"
        )) && // the user wants DNDs or dangerous TEXS in the export
      registryExport.declarationType !== "REGISTRY" && // the user doesn't want a RNDTS declaration only export
      registryExport.registryType !== "SSD" // the user doesn't want a RNDTS declaration only registry (no BSDs in SSD export)
    ) {
      const companies = await prisma.company.findMany({
        where: {
          orgId: {
            in: registryExport.sirets
          }
        },
        select: {
          orgId: true,
          companyTypes: true,
          wasteProcessorTypes: true,
          hasEnabledRegistryDndFromBsdSince: true
        }
      });
      // create a pre-filter that hides DND BSDs pre-hasEnabledRegistryDndFromBsdSince if it's defined for a company
      const orCondition = companies.map(company => {
        if (company.hasEnabledRegistryDndFromBsdSince) {
          // Company has activated DND traceability
          if (
            (company.companyTypes.includes(CompanyType.WASTEPROCESSOR) &&
              (company.wasteProcessorTypes.includes(
                WasteProcessorType.NON_DANGEROUS_WASTES_INCINERATION
              ) ||
                company.wasteProcessorTypes.includes(
                  WasteProcessorType.NON_DANGEROUS_WASTES_STORAGE
                ))) ||
            company.companyTypes.includes(CompanyType.RECOVERY_FACILITY)
          ) {
            // Company is a waste processor with non-dangerous waste incineration or storage profile
            // Include: REGISTRY declarations, DD/TEXS BSDs, and DND BSDs after activation date
            return {
              siret: company.orgId,
              OR: [
                {
                  declarationType: "REGISTRY"
                },
                {
                  wasteType: "DD",
                  declarationType: "BSD"
                },
                {
                  wasteType: "TEXS",
                  declarationType: "BSD",
                  wasteCode: { in: ["17 05 05*", "17 05 03*"] }
                },
                {
                  wasteType: "TEXS",
                  declarationType: "BSD",
                  wasteCode: { in: ["17 05 04", "17 05 06", "20 02 02"] },
                  date: {
                    gte: company.hasEnabledRegistryDndFromBsdSince
                  }
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
            // Company has activated DND traceability but doesn't have the required waste processor profiles
            // Include: REGISTRY declarations and DD/TEXS BSDs only (exclude DND BSDs)
            return {
              siret: company.orgId,
              OR: [
                {
                  declarationType: "REGISTRY"
                },
                {
                  wasteType: "DD",
                  declarationType: "BSD"
                },
                {
                  wasteType: "TEXS",
                  declarationType: "BSD",
                  wasteCode: { in: ["17 05 05*", "17 05 03*"] }
                },
                {
                  wasteType: "TEXS",
                  declarationType: "BSD",
                  wasteCode: { in: ["17 05 04", "17 05 06", "20 02 02"] },
                  date: {
                    gte: company.hasEnabledRegistryDndFromBsdSince
                  }
                }
              ]
            } as Prisma.RegistryLookupWhereInput;
          }
        } else {
          // Company has NOT activated DND traceability
          // Include: REGISTRY declarations, DD BSDs and dangerous TEXS BSDs only (exclude all DND BSDs)
          return {
            siret: company.orgId,
            OR: [
              {
                declarationType: "REGISTRY"
              },
              {
                wasteType: "DD",
                declarationType: "BSD"
              },
              {
                wasteType: "TEXS",
                declarationType: "BSD",
                wasteCode: { in: ["17 05 05*", "17 05 03*"] }
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

    // optimize the query by checking if the export wants all waste types,
    // in which case we don't need to filter by waste type
    const ALL_WASTE_TYPES = ["DND", "DD", "TEXS"] as const;
    const hasAllWasteTypes =
      registryExport.wasteTypes?.length === 3 &&
      ALL_WASTE_TYPES.every(type => registryExport.wasteTypes.includes(type));

    //craft the query
    const query: Prisma.RegistryLookupWhereInput = {
      ...condition,
      reportAsSiret: registryExport.delegateSiret ?? undefined,
      exportRegistryType: registryExport.registryType ?? undefined,
      wasteType:
        registryExport.wasteTypes?.length && !hasAllWasteTypes
          ? { in: registryExport.wasteTypes }
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

    const abortController = new AbortController();
    let cancelCheckIntervalId: ReturnType<typeof setInterval> | null = null;
    const CANCEL_CHECK_INTERVAL_MS = 10000;

    clearCancelCheck = () => {
      if (cancelCheckIntervalId != null) {
        clearInterval(cancelCheckIntervalId);
        cancelCheckIntervalId = null;
      }
    };

    cancelCheckIntervalId = setInterval(async () => {
      try {
        const row = await prisma.registryExport.findUnique({
          where: { id: exportId },
          select: { status: true }
        });
        if (row?.status === RegistryExportStatus.CANCELED) {
          clearCancelCheck();
          abortController.abort();
        }
      } catch (err) {
        logger.warn(`Cancel check failed for export ${exportId}`, err);
      }
    }, CANCEL_CHECK_INTERVAL_MS);

    const inputStreamWithAbort = addAbortSignal(
      abortController.signal,
      inputStream
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
        inputStreamWithAbort,
        transformer,
        csvStream,
        outputStream,
        async error => {
          clearCancelCheck();
          if (error) {
            cancelledByUser = error?.name === "AbortError";
            if (!cancelledByUser) {
              logger.info(`Error on stream for export ${exportId}`, error);
            }
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
        clearCancelCheck();
        logger.info(`Error on output stream for export ${exportId}`, error);
        await upload?.abort();
      });
      pipeline(inputStreamWithAbort, transformer, async error => {
        clearCancelCheck();
        if (error) {
          cancelledByUser = error?.name === "AbortError";
          if (!cancelledByUser) {
            logger.info(`Error on stream for export ${exportId}`, error);
          }
          await upload?.abort();
          return;
        }
        logger.info(`Finished processing export ${exportId}`, { exportId });
      });
    }

    // we call upload.done before it's actually "done", because this call
    // actually triggers the flow (in @aws-sdk/lib-storage)
    const result = await upload.done();
    clearCancelCheck();
    await endExport(
      exportId,
      registryExport.sirets.filter(siret => !unusedSirets.has(siret)),
      result.Key
    );
  } catch (error) {
    clearCancelCheck();
    logger.error(`Error processing export ${exportId}`, error);
    if (upload) {
      await upload
        .abort()
        .catch(err => logger.error("Upload cannot be aborted", err));
    }
    if (!cancelledByUser) {
      await failExport(exportId);
    }
  }
}
