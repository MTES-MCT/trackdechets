import { Transform } from "stream";
import { formatRow } from "./columns";
import { GenericWasteV2 } from "./types";

/**
 * Format rows as data flow
 */
export function wasteFormatter<WasteType extends GenericWasteV2>(
  opts: {
    useLabelAsKey: boolean;
    columnSorter?:
      | ((line: Record<string, string>) => Record<string, string>)
      | null;
  } = { useLabelAsKey: false, columnSorter: null }
) {
  return new Transform({
    readableObjectMode: true,
    writableObjectMode: true,
    transform(waste: WasteType, _encoding, callback) {
      const formatted = formatRow(waste, opts.useLabelAsKey);
      if (opts.columnSorter && !opts.useLabelAsKey) {
        this.push(opts.columnSorter(formatted));
      } else {
        this.push(formatted);
      }
      callback();
    }
  });
}
