import {
  FileDownload,
  QueryResolvers,
  QueryWastesRegistryXlsArgs,
  WasteRegistryType
} from "../../../generated/graphql/types";
import { getFileDownload } from "../../../common/fileDownload";
import { DownloadHandler } from "../../../routers/downloadRouter";
import { getRegistryFileName } from "../../filename";
import * as Excel from "exceljs";
import { wasteFormatter, wastesReader } from "../../streams";
import { getXlsxHeaders } from "../../columns";
import { GraphQLContext } from "../../../types";
import { checkWastesRegistryDownloadPermissions } from "./wasteRegistryBase";

export const wastesRegistryXlsDownloadHandler: DownloadHandler<QueryWastesRegistryXlsArgs> =
  {
    name: "wastesRegistryXls",
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
      res.set("Content-Disposition", `attachment; filename=${filename}.xlsx`);
      const contentType =
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      res.set("Content-Type", contentType);
      res.set("Transfer-Encoding", "chunked");
      const workbook = new Excel.stream.xlsx.WorkbookWriter({
        stream: res
      });
      const worksheet = workbook.addWorksheet("registre");
      const transformer = wasteFormatter();
      reader.pipe(transformer);
      transformer.on("data", waste => {
        if (worksheet.columns === null) {
          // write headers if not present
          worksheet.columns = getXlsxHeaders(waste);
        }

        worksheet.addRow(waste, "n").commit();
      });

      transformer.on("end", () => {
        worksheet.commit();
        workbook.commit();
      });
    }
  };

export async function wastesRegistryXlsResolverFn(
  args: QueryWastesRegistryXlsArgs,
  context: GraphQLContext
): Promise<FileDownload> {
  await checkWastesRegistryDownloadPermissions(args, context);

  return getFileDownload({
    handler: wastesRegistryXlsDownloadHandler.name,
    params: args
  });
}

const wastesXlsResolver: QueryResolvers["wastesRegistryXls"] = async (
  _,
  args,
  context
) => {
  return wastesRegistryXlsResolverFn(args, context);
};

export default wastesXlsResolver;
