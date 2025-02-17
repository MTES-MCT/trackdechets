import { Transform } from "stream";
import { GenericWasteV2 } from "./types";
import { RegistryV2ExportType } from "@td/codegen-back";
import { formatRow } from "./columns";
import { CompanyCachedFetcher } from "./utils";

/**
 * Format rows as data flow
 */
export function wasteFormatterV2<WasteType extends GenericWasteV2>(opts: {
  exportType: RegistryV2ExportType;
  columnSorter?:
    | ((line: Record<string, string>) => Record<string, string>)
    | null;
  useLabelAsKey?: boolean;
}) {
  const companyCachedFetcher = new CompanyCachedFetcher();
  return new Transform({
    readableObjectMode: true,
    writableObjectMode: true,
    async transform(waste: WasteType, _encoding, callback) {
      try {
        const enrichedWaste = await companyCachedFetcher.getCompaniesGivenNames(
          waste
        );
        const formatted = formatRow(
          enrichedWaste,
          opts.exportType,
          opts.useLabelAsKey
        );
        if (opts.columnSorter) {
          this.push(opts.columnSorter(formatted));
        } else {
          this.push(formatted);
        }
        callback();
      } catch (error) {
        callback(error);
      }
    }
  });
}
