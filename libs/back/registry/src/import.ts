import { logger } from "@td/logger";
import { Readable, Writable } from "node:stream";
import { SafeParseReturnType } from "zod";

import { endImport, startImport, updateImportStats } from "./database";
import {
  importOptions,
  ImportType,
  ParsedLine,
  UNAUTHORIZED_ERROR
} from "./options";
import { getTransformCsvStream, getTransformXlsxStream } from "./transformers";
import { getCsvErrorStream, getXlsxErrorStream } from "./errors";

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

  const errorStream =
    fileType === "CSV"
      ? getCsvErrorStream(options)
      : getXlsxErrorStream(options);
  errorStream.pipe(outputErrorStream);

  const transformStream =
    fileType === "CSV"
      ? getTransformCsvStream(options)
      : getTransformXlsxStream(options);

  // Timestamp of the last stats update. Used to avoid updating the stats too often.
  let lastStatsUpdate = 0;

  try {
    await startImport(importId);

    const parsedLinesStream: AsyncIterable<{
      rawLine: Record<string, string>;
      result: SafeParseReturnType<unknown, ParsedLine>;
    }> = inputStream.pipe(transformStream).on("error", error => {
      stats.errors++;
      if (errorStream.writable) {
        errorStream.write({ errors: formatErrorMessage(error.message) });
      }
    });

    for await (const { rawLine, result } of parsedLinesStream) {
      if (!result.success) {
        stats.errors++;
        
        // Build an ordering map that we rely on to sort the errors by the order of the columns
        const orderMap = Object.keys(options.headers).reduce(
          (acc, key, index) => {
            acc[key] = index;
            return acc;
          },
          {}
        );

        const errors = result.error.issues
          .sort((a, b) => orderMap[a.path[0]] - orderMap[b.path[0]])
          .map(issue => {
            const columnName = options.headers[issue.path[0]] ?? issue.path[0];
            return `${columnName} : ${issue.message}`;
          })
          .join("\n");

        errorStream.write({ errors, ...rawLine });
        continue;
      }

      const { reportAsCompanySiret, reportForCompanySiret, reason } =
        result.data;

      if (
        !isAuthorized({
          reportAsCompanySiret,
          delegateToDelegatorsMap,
          reportForCompanySiret,
          allowedSirets
        })
      ) {
        stats.errors++;

        errorStream.write({ errors: UNAUTHORIZED_ERROR, ...rawLine });
        continue;
      }

      if (reason === "MODIFIER") {
        stats.edits++;
      } else if (reason === "ANNULER") {
        stats.cancellations++;
      } else if (reason === "IGNORER") {
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

export function isAuthorized({
  reportAsCompanySiret,
  delegateToDelegatorsMap,
  reportForCompanySiret,
  allowedSirets
}: {
  reportAsCompanySiret: string | null | undefined;
  delegateToDelegatorsMap: Map<string, string[]>;
  reportForCompanySiret: string;
  allowedSirets: string[];
}) {
  if (reportAsCompanySiret) {
    return (
      delegateToDelegatorsMap
        .get(reportAsCompanySiret)
        ?.includes(reportForCompanySiret) ?? false
    );
  }

  return allowedSirets.includes(reportForCompanySiret);
}
