import { logger } from "@td/logger";
import { PassThrough, pipeline, Readable, Writable } from "node:stream";
import { SafeParseReturnType } from "zod";

import {
  getSumOfChanges,
  incrementLocalChangesForCompany,
  RegistryChanges,
  saveCompaniesChanges
} from "./changeAggregates";
import { endImport, startImport, updateImportStats } from "./database";
import { getCsvErrorStream, getXlsxErrorStream } from "./errors";
import {
  importOptions,
  ImportType,
  INTERNAL_ERROR,
  ParsedLine,
  PERMISSION_ERROR,
  UNAUTHORIZED_ERROR
} from "./options";
import {
  getTransformCsvStream,
  getTransformXlsxStream,
  RegistryImportHeaderError
} from "./transformers";
import { Utf8ValidationError, Utf8ValidatorTransform } from "./utf8Transformer";

/**
 * Cleans formula objects and raw formula strings from rawLine data to prevent memory exhaustion
 */
function cleanFormulaObjects(
  rawLine: Record<string, unknown>
): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(rawLine)) {
    if (value && typeof value === "object" && "formula" in value) {
      // Case 1: Formula object - extract just the result
      const formulaObj = value as { formula: unknown; result: unknown };
      cleaned[key] = formulaObj.result ?? "[FORMULE]";
    } else {
      // Keep the value as-is
      cleaned[key] = value;
    }
  }
  return cleaned;
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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
    { importId, importType, fileType }
  );
  const options = importOptions[importType];

  const changesByCompany = new Map<
    string,
    { [reportAsSiret: string]: RegistryChanges }
  >();
  let globalErrorNumber = 0;

  // Prevent memory exhaustion by limiting total errors processed
  // const MAX_TOTAL_ERRORS = 10000; // Maximum number of errors to process
  // const ERROR_RATE_CHECK_INTERVAL = 200; // Check error rate interval in lines
  const MAX_ERRORS_PER_LINE = 10;
  const MEMORY_CHECK_LINE_INTERVAL = 200; // Check memory interval in lines
  const MAX_HEAP_USAGE_MB = 500; // Maximum heap usage in MB
  const THROTTLING_HEAP_USAGE_MB = 300; // Maximum heap usage in MB
  let processedLines = 0;

  const errorStream =
    fileType === "CSV"
      ? getCsvErrorStream(options)
      : getXlsxErrorStream(options);
  errorStream.pipe(outputErrorStream);

  // Only apply utf8 validation on CSV files with reduced buffer size
  const utf8Validator =
    fileType === "CSV" ? new Utf8ValidatorTransform() : new PassThrough();

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
    }> = pipeline(inputStream, utf8Validator, transformStream, _ => {
      // Ignoring error as it will be handled in the catch block
    });

    for await (const { rawLine, result } of parsedLinesStream) {
      processedLines++;

      // Memory-based throttling to prevent spikes by controlling stream backpressure
      const memUsage = process.memoryUsage();
      const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
      if (heapUsedMB > THROTTLING_HEAP_USAGE_MB) {
        await sleep(200);
      }
      // Monitor memory usage to prevent crashes (using already calculated values for efficiency)
      if (processedLines % MEMORY_CHECK_LINE_INTERVAL === 0) {
        const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);

        logger.info(`Import ${importId} memory usage`, {
          heapUsedMB,
          heapTotalMB,
          processedLines,
          globalErrorNumber
        });

        // Terminate if memory usage is too high
        if (heapUsedMB > MAX_HEAP_USAGE_MB) {
          const terminationMessage = `Import terminé prématurément: utilisation mémoire excessive. Le fichier est trop volumineux ou contient trop d'erreurs.`;
          errorStream.write({ errors: terminationMessage });
          logger.error(
            `Import ${importId} terminated due to high memory usage`,
            {
              heapUsedMB,
              heapTotalMB,
              processedLines,
              globalErrorNumber
            }
          );
          break;
        }
      }

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
        const limitedIssues = result.error.issues.slice(0, MAX_ERRORS_PER_LINE);
        const hasMoreErrors = result.error.issues.length > MAX_ERRORS_PER_LINE;

        const errors =
          limitedIssues
            .sort((a, b) => orderMap[a.path[0]] - orderMap[b.path[0]])
            .map(issue => {
              // Handle the special truncation message
              if (issue.path[0] === "__truncated__") {
                return issue.message;
              }
              const columnName =
                options.headers[issue.path[0]] ?? issue.path[0];
              return `${columnName} : ${issue.message}`;
            })
            .join("\n") +
          (hasMoreErrors
            ? `\n... et ${
                result.error.issues.length - MAX_ERRORS_PER_LINE
              } autres erreurs`
            : "");
        // Clean up formula objects and raw formula strings to prevent memory exhaustion
        const cleanedRawLine = cleanFormulaObjects(rawLine);
        errorStream.write({ errors, ...cleanedRawLine });
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

        errorStream.write({
          errors: UNAUTHORIZED_ERROR,
          ...cleanFormulaObjects(rawLine)
        });
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

        errorStream.write({
          errors: PERMISSION_ERROR,
          ...cleanFormulaObjects(rawLine)
        });
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
  } catch (error) {
    globalErrorNumber++;

    const { message, hidden } = formatErrorMessage(error);
    if (errorStream.writable) {
      errorStream.write({ errors: message });
    }

    if (hidden) {
      logger.error(`Error processing import ${importId}`, error);
    }
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

function formatErrorMessage(error: Error) {
  const { message } = error;

  if (error instanceof Utf8ValidationError) {
    return { hidden: false, message: error.message };
  }

  if (error instanceof RegistryImportHeaderError) {
    return { hidden: false, message };
  }

  // CSV parsing error when the content is unreadable
  if (message.includes("Parse Error:")) {
    return {
      hidden: false,
      message:
        "Erreur de format du fichier. Il ne correspond pas au format attendu et n'a pas pu être lu. Vérifiez que le fichier est bien au format CSV ou XLSX"
    };
  }

  // Cannot unzip file or file is not a valid zip
  if (message.includes("invalid signature: 0x")) {
    return {
      hidden: false,
      message:
        "Type de fichier invalide. Vérifiez que le fichier est bien au format XLSX (XLS n'est pas supporté) ou CSV."
    };
  }

  return { hidden: true, message: INTERNAL_ERROR };
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
