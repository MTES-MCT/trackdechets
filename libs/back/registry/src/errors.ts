import { format } from "@fast-csv/format";
import duplexify from "duplexify";
import * as Excel from "exceljs";
import { PassThrough, Writable } from "node:stream";
import { CSV_DELIMITER, ERROR_HEADER, ImportOptions } from "./options";

const errorsKey = "errors";

export function getCsvErrorStream(options: ImportOptions) {
  const errorStream = format({
    delimiter: CSV_DELIMITER,
    headers: [errorsKey, ...Object.keys(options.headers)],
    writeHeaders: false, // Use headers only to reorder the columns properly
    writeBOM: true, // To help Excel recognize UTF-8 encoding
    transform: (row: Record<string, unknown>) => {
      return Object.fromEntries(
        Object.entries(row).map(([key, value]) => {
          if (!value) {
            return [key, null];
          }

          return [key, value instanceof Date ? value.toISOString() : value];
        })
      );
    }
  });

  // Write the headers ourself, as the keys dont match the labels
  errorStream.write({ errors: ERROR_HEADER, ...options.headers });

  return errorStream;
}

export function getXlsxErrorStream(options: ImportOptions) {
  const passThrough = new PassThrough();
  const workbook = new Excel.stream.xlsx.WorkbookWriter({
    stream: passThrough
  });
  const worksheet = workbook.addWorksheet("Rapport d'erreur");

  worksheet.columns = [
    { header: ERROR_HEADER, key: errorsKey },
    ...Object.entries(options.headers).map(([key, name]) => ({
      header: name,
      key
    }))
  ];

  const writableStream = new Writable({
    objectMode: true,
    write(chunk, _, callback) {
      worksheet.addRow(chunk).commit();
      callback();
    },
    async final(callback) {
      worksheet.commit();
      await workbook.commit();
      callback();
    }
  });

  const transformStream = duplexify.obj(writableStream, passThrough);
  return transformStream;
}
