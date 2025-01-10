import { format } from "@fast-csv/format";
import { logger } from "@td/logger";
import { Readable, Writable } from "node:stream";
import { SafeParseReturnType } from "zod";

import { endImport, startImport, updateImportStats } from "./database";
import {
  CSV_DELIMITER,
  ERROR_HEADER,
  importOptions,
  ImportType,
  ParsedLine,
  UNAUTHORIZED_ERROR
} from "./options";
import { getTransformCsvStream, getTransformXlsxStream } from "./transformers";

export async function processStream({
  importId,
  importType,
  inputStream,
  outputErrorStream,
  fileType,
  createdById,
  allowedSirets,
  delegateToDelegatorsMap
}: {
  importId: string;
  importType: ImportType;
  inputStream: Readable;
  outputErrorStream: Writable;
  fileType: "CSV" | "XLSX";
  createdById: string;
  allowedSirets: string[];
  delegateToDelegatorsMap: Map<string, string[]>;
}) {
  logger.info(
    `Processing import ${importId}. File type ${fileType}, import ${importType}`,
    { importId, importType, inputStream, fileType }
  );
  const options = importOptions[importType];
  const stats = {
    errors: 0,
    insertions: 0,
    edits: 0,
    cancellations: 0,
    skipped: 0
  };

  const errorStream = format({
    delimiter: CSV_DELIMITER,
    headers: [ERROR_HEADER, ...Object.values(options.headers)],
    writeHeaders: true,
    transform: (row: Record<string, any>) => {
      // The columns might not be in the right order when received.
      // We reorder them to match the headers for the error file
      const headerKeys = ["errors", ...Object.keys(options.headers)];
      return headerKeys.reduce((reshapedRow, header) => {
        reshapedRow[header] = row[header] ?? "";
        return reshapedRow;
      }, {});
    }
  });
  errorStream.pipe(outputErrorStream);

  const transformStream =
    fileType === "CSV"
      ? getTransformCsvStream(options)
      : getTransformXlsxStream(options);

  // Timestamp of the last stats update. Used to avoid updating the stats too often.
  let lastStatsUpdate = 0;

  try {
    await startImport(importId);

    const dataStream: AsyncIterable<{
      rawLine: Record<string, string>;
      result: SafeParseReturnType<unknown, ParsedLine>;
    }> = inputStream.pipe(transformStream).on("error", error => {
      stats.errors++;
      if (errorStream.writable) {
        errorStream.write({ errors: formatErrorMessage(error.message) });
      }
    });

    for await (const { rawLine, result } of dataStream) {
      if (!result.success) {
        stats.errors++;

        const errors = result.error.issues
          .map(issue => {
            const columnName = options.headers[issue.path[0]] ?? issue.path[0];
            return `${columnName} : ${issue.message}`;
          })
          .join("\n");

        errorStream.write({ errors, ...rawLine });
        continue;
      }

      // Check rights
      const contextualSiretsWithDelegation =
        delegateToDelegatorsMap.get(result.data.reportAsCompanySiret ?? "") ??
        [];
      const contextualAllowedSirets = [
        ...allowedSirets,
        ...contextualSiretsWithDelegation
      ];

      if (
        !contextualAllowedSirets.includes(result.data.reportForCompanySiret)
      ) {
        stats.errors++;

        errorStream.write({ errors: UNAUTHORIZED_ERROR, ...rawLine });
        continue;
      }

      if (result.data.reason === "MODIFIER") {
        stats.edits++;
      } else if (result.data.reason === "ANNULER") {
        stats.cancellations++;
      } else if (result.data.reason === "IGNORER") {
        stats.skipped++;
        continue;
      } else {
        stats.insertions++;
      }

      const line = { ...result.data, createdById };

      await options.saveLine({ line, importId });

      const now = Date.now();
      if (now - lastStatsUpdate > 5 * 1000) {
        lastStatsUpdate = now;
        updateImportStats({ importId, stats });
      }
    }
  } catch (err) {
    logger.error(`Error processing import ${importId}`, { importId, err });
  } finally {
    errorStream.end();

    const sirets = await options.getImportSiretsAssociations(importId);
    await endImport({ importId, stats, sirets });
  }

  return stats;
}

function formatErrorMessage(message: string) {
  // CSV parsing error when the content is unreadable
  if (message.includes("Parse Error:")) {
    return "Erreur de format du fichier. Il ne correspond pas au format attendu et n'a pas pu être lu. Vérifiez que le fichier est bien au format CSV ou XLSX";
  }

  return message;
}
