import { format } from "@fast-csv/format";
import { CSV_DELIMITER, ERROR_HEADER, ImportOptions } from "./options";

export function getCsvErrorStream(options: ImportOptions) {
  const errorStream = format({
    delimiter: CSV_DELIMITER,
    headers: ["errors", ...Object.keys(options.headers)],
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
