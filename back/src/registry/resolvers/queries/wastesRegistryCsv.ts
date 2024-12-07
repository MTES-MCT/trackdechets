import {
  FileDownload,
  QueryResolvers,
  QueryWastesRegistryCsvArgs,
  WasteRegistryType
} from "@td/codegen-back";
import { getFileDownload } from "../../../common/fileDownload";
import { DownloadHandler } from "../../../routers/downloadRouter";
import { getRegistryFileName } from "../../filename";
import { format } from "@fast-csv/format";
import { wasteFormatter, wastesReader } from "../../streams";

import { GraphQLContext } from "../../../types";
import { checkWastesRegistryDownloadPermissions } from "./wasteRegistryBase";

export const wastesRegistryCsvDownloadHandler: DownloadHandler<QueryWastesRegistryCsvArgs> =
  {
    name: "wastesRegistryCsv",
    handler: (_, res, args) => {
      if (args.registryType === "SSD") {
        res.sendStatus(404);
        return;
      }
      const reader = wastesReader({
        registryType: args.registryType as Exclude<WasteRegistryType, "SSD">,
        sirets: args.sirets,
        where: args.where,
        chunk: 100
      });
      const filename = getRegistryFileName(args.registryType, args.sirets);
      res.set("Content-disposition", `attachment; filename=${filename}.csv`);
      res.set("Content-Type", "text/csv");
      res.set("Transfer-Encoding", "chunked");
      const csvStream = format({ headers: true, delimiter: ";" });
      const transformer = wasteFormatter({ useLabelAsKey: true });
      reader.pipe(transformer).pipe(csvStream).pipe(res);
    }
  };

export async function wastesRegistryCsvResolverFn(
  args: QueryWastesRegistryCsvArgs,
  context: GraphQLContext
): Promise<FileDownload> {
  await checkWastesRegistryDownloadPermissions(args, context);

  return getFileDownload({
    handler: wastesRegistryCsvDownloadHandler.name,
    params: args
  });
}

const wastesRegistryCsvResolver: QueryResolvers["wastesRegistryCsv"] = async (
  _,
  args,
  context
) => {
  return wastesRegistryCsvResolverFn(args, context);
};

export default wastesRegistryCsvResolver;
