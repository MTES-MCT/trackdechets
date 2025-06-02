import {
  ListObjectsV2Command,
  GetObjectCommand,
  _Object
} from "@aws-sdk/client-s3";
import { Readable } from "stream";
import { parse as parseCsv } from "@fast-csv/parse";
import * as Excel from "exceljs";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { registryS3Client } from "../s3";

interface ErrorStats {
  totalCount: number;
  distinctFiles: Set<string>;
}

async function processCsvStream(
  stream: Readable,
  errorCounts: Map<string, ErrorStats>,
  fileKey: string
): Promise<void> {
  const parser = stream.pipe(
    parseCsv({
      headers: false,
      ignoreEmpty: true,
      delimiter: ";",
      trim: true
    })
  );

  for await (const record of parser) {
    if (record && record.length > 0) {
      const firstColumnContent = String(record[0] ?? "");
      const errors = firstColumnContent.split("\n");
      for (const error of errors) {
        const trimmedError = error.trim();
        if (trimmedError) {
          const currentStats = errorCounts.get(trimmedError) || {
            totalCount: 0,
            distinctFiles: new Set<string>()
          };
          currentStats.totalCount++;
          currentStats.distinctFiles.add(fileKey);
          errorCounts.set(trimmedError, currentStats);
        }
      }
    }
  }
}

async function processXlsxStream(
  stream: Readable,
  errorCounts: Map<string, ErrorStats>,
  fileKey: string
): Promise<void> {
  const workbookReader = new Excel.stream.xlsx.WorkbookReader(stream, {
    entries: "emit",
    sharedStrings: "cache",
    styles: "cache",
    hyperlinks: "cache",
    worksheets: "emit"
  });

  try {
    for await (const worksheetReader of workbookReader) {
      for await (const row of worksheetReader) {
        const firstCell = row.getCell(1);
        let firstColumnContent = "";

        if (firstCell && firstCell.value) {
          if (
            typeof firstCell.value === "object" &&
            firstCell.value !== null &&
            "richText" in firstCell.value
          ) {
            const richText = firstCell.value.richText as Excel.RichText[];
            firstColumnContent = richText.map(rt => rt.text).join("");
          } else if (firstCell.text) {
            firstColumnContent = firstCell.text;
          } else {
            firstColumnContent = String(firstCell.value ?? "");
          }
        }

        const errors = firstColumnContent.split("\n");
        for (const error of errors) {
          const trimmedError = error.trim();
          if (trimmedError) {
            const currentStats = errorCounts.get(trimmedError) || {
              totalCount: 0,
              distinctFiles: new Set<string>()
            };
            currentStats.totalCount++;
            currentStats.distinctFiles.add(fileKey);
            errorCounts.set(trimmedError, currentStats);
          }
        }
      }
      // Process the first sheet only
      break;
    }
  } catch (error) {
    console.error("Error processing XLSX stream with exceljs:", error);
    throw error;
  }
}

async function main() {
  const argv = await yargs(hideBin(process.argv))
    .option("bucket", {
      alias: "b",
      type: "string",
      description: "S3 bucket name",
      demandOption: true
    })
    .option("maxFiles", {
      alias: "m",
      type: "number",
      description: "Maximum number of files to process",
      default: 100
    })
    .option("top", {
      alias: "t",
      type: "number",
      description: "Number of top errors to display",
      default: 20
    })
    .help()
    .alias("help", "h").argv;

  const bucketName = argv.bucket;
  const maxFilesToProcess = argv.maxFiles;
  const topN = argv.top;

  const errorCounts = new Map<string, ErrorStats>();

  console.log(`Analyzing errors in S3 bucket: s3://${bucketName}/`);
  console.log(`Attempting to process up to ${maxFilesToProcess} files.`);
  console.log(`Displaying top ${topN} errors.`);

  let continuationToken: string | undefined = undefined;
  const allS3Objects: _Object[] = [];

  try {
    console.log("Listing all objects in the bucket to determine recency...");
    do {
      const listObjectsParams = {
        Bucket: bucketName,
        ContinuationToken: continuationToken
      };
      const listResponse = await registryS3Client.send(
        new ListObjectsV2Command(listObjectsParams)
      );

      if (listResponse.Contents) {
        for (const object of listResponse.Contents) {
          if (object.Key && !object.Key.endsWith("/") && object.LastModified) {
            allS3Objects.push(object);
          }
        }
      }
      continuationToken = listResponse.NextContinuationToken;
    } while (continuationToken);

    console.log(
      `Found ${allS3Objects.length} total relevant objects in the bucket.`
    );

    allS3Objects.sort(
      (a, b) =>
        (b.LastModified?.getTime() || 0) - (a.LastModified?.getTime() || 0)
    );

    const filesToProcessActually = allS3Objects.slice(0, maxFilesToProcess);
    let processedFileCount = 0;

    console.log(
      `Processing the ${filesToProcessActually.length} first files...`
    );

    for (const s3Object of filesToProcessActually) {
      const key = s3Object.Key!;
      const fileSizeKB = s3Object.Size
        ? (s3Object.Size / 1024).toFixed(2)
        : "unknown";
      const lastModified = s3Object.LastModified?.toISOString() || "unknown";

      console.log(
        `Processing file: ${key} (${fileSizeKB} KB, Modified: ${lastModified})`
      );

      try {
        const getObjectParams = { Bucket: bucketName, Key: key };
        const getObjectResponse = await registryS3Client.send(
          new GetObjectCommand(getObjectParams)
        );

        if (!getObjectResponse.Body) {
          console.warn(`Skipping ${key}: No body content.`);
          continue;
        }
        const bodyStream = getObjectResponse.Body as Readable;

        if (key.toLowerCase().endsWith(".csv")) {
          await processCsvStream(bodyStream, errorCounts, key);
          processedFileCount++;
        } else if (
          key.toLowerCase().endsWith(".xls") ||
          key.toLowerCase().endsWith(".xlsx")
        ) {
          await processXlsxStream(bodyStream, errorCounts, key);
          processedFileCount++;
        } else {
          console.warn(
            `Skipping ${key}: Unsupported file type. Only .csv, .xls, .xlsx are supported.`
          );
        }
      } catch (error) {
        console.error(
          `Error processing file ${key}:`,
          error instanceof Error ? error.message : String(error)
        );
      }
    }

    console.log(
      `\nFound ${allS3Objects.length} relevant objects. Attempted to process ${filesToProcessActually.length} most recent files. Successfully processed ${processedFileCount} files.`
    );

    if (errorCounts.size === 0) {
      console.log("No errors found or no files processed successfully.");
      return;
    }

    const sortedErrors = Array.from(errorCounts.entries()).sort(
      ([, statsA], [, statsB]) =>
        // Sort by number of files first, then by total count if tied
        statsB.distinctFiles.size - statsA.distinctFiles.size ||
        statsB.totalCount - statsA.totalCount
    );

    console.log(
      `\nTop ${Math.min(topN, sortedErrors.length)} errors (out of ${
        sortedErrors.length
      } unique errors) sorted by number of files affected:`
    );
    for (let i = 0; i < Math.min(topN, sortedErrors.length); i++) {
      const [error, stats] = sortedErrors[i];
      console.log(
        `  Count: ${stats.totalCount} (in ${stats.distinctFiles.size} files)\tError: "${error}"`
      );
    }
  } catch (error) {
    console.error(
      "An unexpected error occurred during the S3 listing or script execution:",
      error
    );
  }
}

main().catch(err => {
  console.error("Script failed:", err);
  process.exit(1);
});
