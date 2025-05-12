import { logger } from "@td/logger";
import { Readable, Writable } from "node:stream";
import { SafeParseReturnType } from "zod";

import { endImport, startImport, updateImportStats } from "./database";
import {
  importOptions,
  ImportType,
  INTERNAL_ERROR,
  ParsedLine,
  PERMISSION_ERROR,
  UNAUTHORIZED_ERROR
} from "./options";
import { getTransformCsvStream, getTransformXlsxStream } from "./transformers";
import { getCsvErrorStream, getXlsxErrorStream } from "./errors";
import {
  RegistryChanges,
  getSumOfChanges,
  incrementLocalChangesForCompany,
  saveCompaniesChanges
} from "./changeAggregates";

export async function processStream({
  importId,
  importType,
  inputStream,
  outputErrorStream,
  fileType,
  createdById,
  allowedSirets,
  allowedWithRolesSirets,
  delegatorSiretsByDelegateSirets
}: {
  importId: string;
  importType: ImportType;
  inputStream: Readable;
  outputErrorStream: Writable;
  fileType: "CSV" | "XLSX";
  createdById: string;
  allowedSirets: string[];
  allowedWithRolesSirets: string[];
  delegatorSiretsByDelegateSirets: Map<string, string[]>;
}) {
  logger.info(
    `Processing import ${importId}. File type ${fileType}, import ${importType}`,
    { importId, importType, inputStream, fileType }
  );
  const options = importOptions[importType];
  const changesByCompany = new Map<
    string,
    { [reportAsSiret: string]: RegistryChanges }
  >();
  let globalErrorNumber = 0;

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
      globalErrorNumber++;

      if (errorStream.writable) {
        errorStream.write({ errors: formatErrorMessage(error.message) });
      }
    });

    for await (const { rawLine, result } of parsedLinesStream) {
      if (!result.success) {
        globalErrorNumber++;

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
          delegatorSiretsByDelegateSirets,
          reportForCompanySiret,
          allowedSirets
        })
      ) {
        // If someone wrongly tries to import data for a company they are not allowed on,
        // dont increment their RegistryChangeAggregate
        globalErrorNumber++;

        errorStream.write({ errors: UNAUTHORIZED_ERROR, ...rawLine });
        continue;
      }

      if (
        !isAuthorized({
          reportAsCompanySiret,
          delegatorSiretsByDelegateSirets,
          reportForCompanySiret,
          allowedSirets: allowedWithRolesSirets
        })
      ) {
        globalErrorNumber++;

        errorStream.write({ errors: PERMISSION_ERROR, ...rawLine });
        continue;
      }

      const line = { ...result.data, createdById };
      await options.saveLine({ line, importId });

      incrementLocalChangesForCompany(changesByCompany, {
        reason,
        reportForCompanySiret,
        reportAsCompanySiret: reportAsCompanySiret ?? reportForCompanySiret
      });

      const now = Date.now();
      if (now - lastStatsUpdate > 5 * 1000) {
        lastStatsUpdate = now;
        const stats = getSumOfChanges(changesByCompany, globalErrorNumber);
        await updateImportStats({
          importId,
          stats
        });
      }
    }
  } catch (err) {
    logger.error(`Error processing import ${importId}`, err);
    errorStream.write({ errors: INTERNAL_ERROR });
  } finally {
    errorStream.end();

    await saveCompaniesChanges(changesByCompany, {
      type: importType,
      source: "FILE",
      createdById
    });

    const sirets = await options.getImportSiretsAssociations(importId);
    const stats = getSumOfChanges(changesByCompany, globalErrorNumber);
    await endImport({
      importId,
      stats,
      sirets
    });
  }

  const stats = getSumOfChanges(changesByCompany, globalErrorNumber);
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
  delegatorSiretsByDelegateSirets,
  reportForCompanySiret,
  allowedSirets
}: {
  reportAsCompanySiret: string | null | undefined;
  delegatorSiretsByDelegateSirets: Map<string, string[]>;
  reportForCompanySiret: string;
  allowedSirets: string[];
}) {
  if (reportAsCompanySiret && reportAsCompanySiret !== reportForCompanySiret) {
    return (
      delegatorSiretsByDelegateSirets
        .get(reportAsCompanySiret)
        ?.includes(reportForCompanySiret) ?? false
    );
  }

  return allowedSirets.includes(reportForCompanySiret);
}
