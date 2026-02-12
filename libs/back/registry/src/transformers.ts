import { parse } from "@fast-csv/parse";
import { logger } from "@td/logger";
import duplexify from "duplexify";
import * as Excel from "exceljs";
import { PassThrough, Readable } from "node:stream";

import { CSV_DELIMITER, ERROR_HEADER, ImportOptions } from "./options";
import { format } from "date-fns";

export class RegistryImportHeaderError extends Error {
  constructor(message: string) {
    super(message);

    this.name = "RegistryImportHeaderError";
  }
}

export function getTransformCsvStream(options: ImportOptions) {
  const parseStream = parse({
    headers: rawHeaders => {
      const reverseHeadersMap = new Map(
        Object.entries(options.headers).map(([key, value]) => [
          normalizeHeader(value),
          key
        ])
      );

      return rawHeaders.map(header => {
        if (!header || header === ERROR_HEADER) {
          return undefined; // Return undefined to indicate that the header is ignored
        }
        const normalizedRawHeader = normalizeHeader(header);
        if (!reverseHeadersMap.has(normalizedRawHeader)) {
          return header; // Return the original header. The "headers" event handler will detect the error.
        }
        return reverseHeadersMap.get(normalizedRawHeader);
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
          `Colonne ${getColumnLetterFromIndex(
            idx + 1
          )} - en-tête "${headerKey}" inconnue`
        );
      }

      if (errors.length > 0) {
        // Destroy the stream to stop the parsing process without flushing it
        parseStream.destroy(
          new RegistryImportHeaderError(
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

  // Create a mapping between the index of the column and the header
  // This will be filled while reading the first row
  const indexToHeaderMapping = new Map<number, string>();

  const createReader = async function* () {
    for await (const worksheetReader of workbookReader) {
      for await (const row of worksheetReader) {
        // In Excel, the first row is 1
        if (row.number === 1) {
          const reverseHeadersMap = new Map(
            Object.entries(options.headers).map(([key, value]) => [
              normalizeHeader(value),
              key
            ])
          );
          const errors: string[] = [];

          for (let index = 0; index < row.cellCount; index++) {
            const { value, col } = row.getCell(index + 1);

            const colLetter = getColumnLetterFromIndex(parseInt(col, 10));

            if (!value || value === ERROR_HEADER) {
              continue;
            }

            if (!isLiteralCellValue(value)) {
              logger.error(`Invalid column header`, { index, value });
              errors.push(`Colonne ${colLetter} - en-tête illisible`);
              continue;
            }

            const normalizedRawHeader = normalizeHeader(value.toString());
            if (!reverseHeadersMap.has(normalizedRawHeader)) {
              errors.push(`Colonne ${colLetter} - en-tête "${value}" inconnue`);
              continue;
            }

            const headerKey = reverseHeadersMap.get(normalizedRawHeader);
            indexToHeaderMapping.set(index, headerKey!);
          }

          if (errors.length > 0) {
            throw new RegistryImportHeaderError(
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
        for (const [index, key] of indexToHeaderMapping.entries()) {
          const cell = row.getCell(index + 1);
          const value = getCellValue(cell);
          rawLine[key] = value;

          if (value) {
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

function getColumnLetterFromIndex(index: number) {
  let letter = "";
  while (index > 0) {
    index--;
    letter = String.fromCharCode(65 + (index % 26)) + letter;
    index = Math.floor(index / 26);
  }
  return letter;
}

function normalizeHeader(header: string) {
  return header
    .trim()
    .toLowerCase()
    .normalize("NFD") // é => e + ´
    .replace(/[\u0300-\u036f]/g, ""); // Remove diacritics
}

function isLiteralCellValue(value: unknown) {
  return typeof value !== "object";
}

function getCellValue(cell: Excel.Cell) {
  if (!cell.value) {
    return null;
  }

  if (cell.type === Excel.ValueType.Date && cell.style.numFmt) {
    return applyDateFormat(cell.value as Date, cell.style.numFmt);
  }

  if (cell.type === Excel.ValueType.Number) {
    return cell.text;
  }

  if (cell.type === Excel.ValueType.Hyperlink) {
    const hyperlinkValue = cell.value as Excel.CellHyperlinkValue;
    return hyperlinkValue.text || hyperlinkValue.hyperlink;
  }

  if (cell.type === Excel.ValueType.RichText) {
    const richTextValue = cell.value as Excel.CellRichTextValue;
    return richTextValue.richText.map(rt => rt.text).join("");
  }

  if (cell.type === Excel.ValueType.Formula) {
    const formulaValue = cell.value as Excel.CellFormulaValue;
    return formulaValue.result !== undefined ? String(formulaValue.result) : "";
  }

  return cell.value;
}

function applyDateFormat(value: Date, formatStr: string) {
  // Hours format
  if (
    formatStr === "hh:mm" ||
    formatStr === "hh:mm:ss" ||
    formatStr.includes("h:mm:ss")
  ) {
    return format(value, "HH:mm");
  }

  // Could be a misinterpretation of the waste code
  if (formatStr === "dd mm yy") {
    return format(value, "dd MM yy");
  }

  // Excel passes MM as mm for dates (and minutes...)
  // And this way if we receive dd/mm/yyyy its okay
  return format(value, "yyyy-MM-dd");
}
