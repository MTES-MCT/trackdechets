import { logger } from "@td/logger";
import { prisma } from "@td/prisma";
import { getUploadWithWritableStream } from "@td/registry";
import { Job } from "bull";
import * as Excel from "exceljs";

import { format as csvFormat } from "@fast-csv/format";

import type { AllWasteV2, DateFilter } from "@td/codegen-back";
import { Upload } from "@aws-sdk/lib-storage";
import { estypes } from "@elastic/elasticsearch";
import { UserInputError } from "../../common/errors";
import { pipeline, Readable } from "stream";
import {
  Prisma,
  RegistryExhaustiveExport,
  RegistryExportFormat,
  RegistryExportStatus
} from "@prisma/client";
import {
  dateFilterToElasticFilter,
  toPrismaBsds
} from "../../registryV2/elastic";
import { BsdElastic, client, index } from "../../common/elastic";
import { toWaste } from "../../registryV2/converters";
import { wasteFormatterV2 } from "../../registryV2/streams";
import { EXHAUSTIVE_EXPORT_COLUMNS } from "../../registryV2/columns";

// we have all verified infos in the registryExport,
// but the date range is a bit more fine in the query than in the object
// so we need to pass it down
export type RegistryExhaustiveExportJobArgs = {
  exportId: string;
  dateRange: DateFilter;
};

const LOOKUP_PAGE_SIZE = 100;

const streamLookup = (
  query: estypes.QueryContainer,
  addEncounteredSirets: (sirets: string[]) => void
): Readable => {
  let cursorId: string | null = null;
  let cursorDate: number | null = null;
  return new Readable({
    objectMode: true,
    highWaterMark: LOOKUP_PAGE_SIZE * 2,
    async read() {
      try {
        const { body } = await client.search({
          index: index.alias,
          body: {
            size:
              LOOKUP_PAGE_SIZE +
              // Take one more result to know if there's a next page
              // it's removed from the actual results though
              1,
            query: {
              bool: {
                ...query.bool,
                // make sure ordering is consistent by filtering out possible null value on sort key
                must: {
                  ...query.bool?.must,
                  exists: { field: "updatedAt" }
                }
              }
            },
            sort: {
              updatedAt: "ASC",
              id: "ASC"
            },
            search_after: cursorDate ? [cursorDate, cursorId] : undefined
          }
        });
        const searchHits = body.hits as estypes.HitsMetadata<BsdElastic>;
        const hits = searchHits.hits.slice(0, LOOKUP_PAGE_SIZE);
        const bsds = await toPrismaBsds(
          hits.map(hit => hit._source).filter(Boolean)
        );
        for (const hit of hits) {
          if (!hit._source) {
            continue;
          }
          const { type, id, isAllWasteFor } = hit._source;
          cursorDate = hit._source.updatedAt;
          cursorId = hit._source.id;
          addEncounteredSirets(isAllWasteFor as string[]);
          const waste = bsds[type].find(waste => waste.id === id);
          const mapped = toWaste("ALL", undefined, {
            [type]: waste
          }) as AllWasteV2;
          if (mapped) {
            this.push(mapped);
          }
        }
        if (searchHits.hits.length <= LOOKUP_PAGE_SIZE) {
          this.push(null);
          return;
        }
      } catch (err) {
        this.destroy(err);
      }
    }
  });
};

async function startExport(
  exportId: string
): Promise<RegistryExhaustiveExport | null> {
  try {
    const registryExport = await prisma.registryExhaustiveExport.update({
      where: { id: exportId, status: RegistryExportStatus.PENDING },
      data: { status: RegistryExportStatus.STARTED }
    });
    return registryExport;
  } catch {
    return null;
  }
}

async function failExport(exportId: string) {
  await prisma.registryExhaustiveExport.updateMany({
    where: { id: exportId },
    data: { status: RegistryExportStatus.FAILED }
  });
}

async function endExport(
  exportId: string,
  siretsEncountered: string[],
  s3FileKey?: string
) {
  const update: Prisma.RegistryExhaustiveExportUpdateArgs["data"] = {
    status: RegistryExportStatus.SUCCESSFUL,
    s3FileKey
  };
  if (siretsEncountered.length > 0) {
    update.sirets = siretsEncountered;
  }
  await prisma.registryExhaustiveExport.update({
    where: { id: exportId },
    data: update
  });
}

export async function processRegistryExhaustiveExportJob(
  job: Job<RegistryExhaustiveExportJobArgs>
) {
  const { exportId, dateRange } = job.data;
  let upload: Upload | null = null;

  try {
    logger.info(`Starting export ${exportId}`);
    const registryExport = await startExport(exportId);
    if (!registryExport) {
      throw new UserInputError(
        `L'export exhaustif ${exportId} est introuvable`
      );
    }
    const columns = EXHAUSTIVE_EXPORT_COLUMNS;
    // create s3 file with stream
    const streamInfos = getUploadWithWritableStream({
      bucketName: process.env.S3_REGISTRY_EXHAUSTIVE_EXPORTS_BUCKET,
      key: `${exportId}${registryExport.format === "CSV" ? ".csv" : ".xlsx"}`,
      contentType:
        registryExport.format === "CSV"
          ? "text/csv"
          : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });
    upload = streamInfos.upload;
    const outputStream = streamInfos.s3Stream;

    // TODO craft elastic query from params
    // query on registryExport.sirets & dateRange
    const query: {
      bool: estypes.BoolQuery & {
        filter: estypes.QueryContainer[];
      };
    } = {
      bool: {
        filter: [
          dateFilterToElasticFilter("updatedAt", dateRange),
          {
            bool: {
              should: [
                {
                  terms: {
                    isExhaustiveWasteFor: registryExport.sirets
                  }
                }
              ]
            }
          }
        ]
      }
    };
    // if the export was for all of a user's companies, all the sirets are in the registryExport at the beginning
    // in order to cleanup the exports list, we memorize the
    // sirets that are never encountered during the export, and update the list of sirets
    // in registryExport at the end
    const unusedSirets = new Set(registryExport.sirets);
    const addEncounteredSirets = (sirets: string[]) => {
      for (const siret of sirets) {
        unusedSirets.delete(siret);
      }
    };
    const inputStream = streamLookup(query, addEncounteredSirets);

    // handle CSV exports
    if (registryExport.format === RegistryExportFormat.CSV) {
      const csvStream = csvFormat({
        headers: Object.keys(columns).map(key => columns[key].label),
        delimiter: ";",
        alwaysWriteHeaders: true
      });
      const transformer = wasteFormatterV2({
        exportType: "ALL",
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
        exportType: "ALL"
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
