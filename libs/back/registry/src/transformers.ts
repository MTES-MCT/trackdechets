import { parse } from "@fast-csv/parse";
import { logger } from "@td/logger";
import duplexify from "duplexify";
import * as Excel from "exceljs";
import { PassThrough, Readable } from "node:stream";

import { CSV_DELIMITER, ERROR_HEADER, ImportOptions } from "./options";

export function getTransformCsvStream(options: ImportOptions) {
  const parseStream = parse({
    headers: rawHeaders => {
      const reverseHeadersMap = new Map(
        Object.entries(options.headers).map(([key, value]) => [value, key])
      );

      return rawHeaders.map(header => {
        if (!header || header === ERROR_HEADER) {
          return undefined; // Return undefined to indicate that the header is ignored
        }
        if (!reverseHeadersMap.has(header)) {
          return header; // Return the original header. The "headers" event handler will detect the error.
        }
        return reverseHeadersMap.get(header);
      });
    },
    renameHeaders: true,
    ignoreEmpty: true,
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
      const expectedHeadersKeys = new Set(Object.keys(options.headers));

      const errors: string[] = [];
      const headerEntries = headers.filter(v => v !== undefined).entries();

      for (const [idx, headerKey] of headerEntries) {
        if (expectedHeadersKeys.has(headerKey)) {
          continue;
        }

        errors.push(
          `Colonne numéro ${idx + 1} - colonne "${headerKey}" inconnue`
        );
      }

      if (errors.length > 0) {
        // Destroy the stream to stop the parsing process without flushing it
        parseStream.destroy(
          new Error(
            [
              "Les en-têtes de colonnes ne correspondent pas au modèle. Assurez-vous que vous utilisez le bon modèle. Le détail des colonnes en erreur est précisé ci-dessous:",
              ...errors
            ].join("\n")
          )
        );
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
  const workbookReader = new Excel.stream.xlsx.WorkbookReader(inputStream, {
    entries: "emit",
    sharedStrings: "cache",
    hyperlinks: "cache",
    styles: "cache",
    worksheets: "emit"
  });

  const createReader = async function* () {
    for await (const worksheetReader of workbookReader) {
      for await (const row of worksheetReader) {
        // In Excel, the first row is 1
        if (row.number === 1) {
          const headerLabels = Object.values(options.headers);
          const errors: string[] = [];

          headerLabels.forEach((label, index) => {
            const {
              value,
              col: colLabel,
              row: rowLabel
            } = row.getCell(index + 1);

            if (value !== label) {
              errors.push(
                `En-tête non valide dans la cellule ${colLabel}:${rowLabel}. Attendu "${label}", reçu "${value}"`
              );
            }
          });

          if (errors.length > 0) {
            throw new Error(
              [
                "Les en-têtes de colonnes ne correspondent pas au modèle. Assurez-vous que vous utilisez le bon modèle. Le détail des colonnes en erreur est précisé ci-dessous:",
                ...errors
              ].join("\n")
            );
          }

          continue;
        }

        let isEmptyLine = true;
        const rawLine = {};
        const keys = Object.keys(options.headers);
        for (const [index, key] of keys.entries()) {
          const { value } = row.getCell(index + 1);
          rawLine[key] = value === null ? undefined : value;
          if (rawLine[key]) {
            isEmptyLine = false;
          }
        }

        if (isEmptyLine) {
          continue;
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
