import { parse } from "@fast-csv/parse";
import { logger } from "@td/logger";
import duplexify from "duplexify";
import * as Excel from "exceljs";
import { PassThrough, Readable } from "node:stream";

import { CSV_DELIMITER, ImportOptions } from "./options";

export function getTransformCsvStream(options: ImportOptions) {
  const parseStream = parse({
    headers: rawHeaders => {
      const headerLabels = Object.values(options.headers);
      const headerKeys = Object.keys(options.headers);
      return rawHeaders.map((header, index) => {
        if (header !== headerLabels[index]) {
          return header; // Return the original header. The "headers" event handler will detect the error.
        }
        return headerKeys[index];
      });
    },
    renameHeaders: true,
    delimiter: CSV_DELIMITER,
    trim: true
  })
    .transform(async rawLine => {
      // Iterate over each key in the row and replace empty strings with null
      for (const key in rawLine) {
        if (rawLine[key] === "") {
          rawLine[key] = undefined;
        }
      }

      const result = await options.safeParseAsync(rawLine);
      return { rawLine, result };
    })
    .on("headers", headers => {
      const expectedHeaders = Object.keys(options.headers);

      for (const [idx, header] of headers.entries()) {
        if (header === expectedHeaders[idx]) {
          continue;
        }
        // Destroy the stream to stop the parsing process without flushing it
        parseStream.destroy(
          new Error(
            `En-tête non valide pour la colonne numéro ${idx + 1}. Attendu "${
              options.headers[expectedHeaders[idx]]
            }", reçu "${header}"`
          )
        );
        break;
      }
    })
    .on("error", error => {
      logger.error(`Error while parsing CSV. ${error.message}`);
    })
    .on("end", (rowCount: number) =>
      logger.info(`Finished parsing CSV import. ${rowCount} rows parsed.`)
    );

  return parseStream;
}

export function getTransformXlsxStream(options: ImportOptions) {
  // Create an inputStream to feed the WorkbookReader
  const inputStream = new PassThrough();
  const workbookReader = new Excel.stream.xlsx.WorkbookReader(inputStream, {});

  const createReader = async function* () {
    for await (const worksheetReader of workbookReader) {
      for await (const row of worksheetReader) {
        if (row.number === 0) {
          const headerLabels = Object.values(options.headers);

          headerLabels.forEach((label, index) => {
            const cellValue = row.getCell(index).value;
            if (cellValue !== label) {
              throw new Error(
                `En-tête non valide à l'index ${index}. Attendu "${label}", reçu "${cellValue}"`
              );
            }
          });

          continue;
        }

        const rawLine = {};
        const keys = Object.keys(options.headers);
        for (const [index, key] of keys.entries()) {
          rawLine[key] = row.getCell(index + 1).value;
        }

        const result = await options.safeParseAsync(rawLine);
        yield { rawLine, result };
      }
    }
  };

  const outputStream = Readable.from(createReader());

  // Create a duplex (transform) stream from the passThrough & Exceljs ouput stream
  const xslxTransformStream = duplexify.obj(inputStream, outputStream);
  return xslxTransformStream;
}
