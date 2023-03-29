import { Readable, ReadableOptions, Transform } from "stream";
import {
  WasteRegistryType,
  WasteRegistryWhere
} from "../generated/graphql/types";
import { formatRow } from "./columns";
import { GenericWaste } from "./types";
import getWasteConnection from "./wastes";

export interface WasteReaderOptions extends ReadableOptions {
  read?(this: WasteReader, size: number): void;
}
export class WasteReader extends Readable {
  after: string | null;
  constructor(opts?: WasteReaderOptions) {
    super(opts);
    this.after = null;
  }
}
export interface WasteReaderArgs {
  registryType: WasteRegistryType;
  sirets: string[];
  where?: WasteRegistryWhere | null;
  chunk?: number;
}

/**
 * Reads wastes in chunks
 */
export function wastesReader({
  registryType,
  sirets,
  where,
  chunk = 100
}: WasteReaderArgs): Readable {
  const stream = new WasteReader({
    objectMode: true,
    read(this) {
      const args = {
        sirets,
        first: chunk,
        ...(this.after ? { after: this.after } : {}),
        ...(where ? { where } : {})
      };

      getWasteConnection(registryType, args).then(({ edges, pageInfo }) => {
        if (edges.length === 0) {
          // end of stream
          this.push(null);
        } else {
          edges.forEach(({ node: waste }) => {
            this.push(waste);
          });
          if (pageInfo.hasNextPage) {
            this.after = pageInfo.endCursor;
          } else {
            this.push(null);
          }
        }
      });
    }
  });

  return stream;
}

/**
 * Format rows as data flow
 */
export function wasteFormatter<WasteType extends GenericWaste>(
  opts = { useLabelAsKey: false }
) {
  return new Transform({
    readableObjectMode: true,
    writableObjectMode: true,
    transform(waste: WasteType, _encoding, callback) {
      const formatted = formatRow(waste, opts.useLabelAsKey);
      this.push(formatted);
      callback();
    }
  });
}
