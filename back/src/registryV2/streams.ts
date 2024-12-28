import { Transform } from "stream";
import { GenericWasteV2 } from "./types";
import { RegistryV2ExportType } from "@td/codegen-back";
import { formatRow } from "./columns";

/**
 * Format rows as data flow
 */
export function wasteFormatterV2<WasteType extends GenericWasteV2>(opts: {
  exportType: RegistryV2ExportType;
  columnSorter?:
    | ((line: Record<string, string>) => Record<string, string>)
    | null;
}) {
  return new Transform({
    readableObjectMode: true,
    writableObjectMode: true,
    transform(waste: WasteType, _encoding, callback) {
      const formatted = formatRow(waste, opts.exportType);
      if (opts.columnSorter) {
        this.push(opts.columnSorter(formatted));
      } else {
        this.push(formatted);
      }
      callback();
    }
  });
}
