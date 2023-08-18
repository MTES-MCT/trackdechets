import {
  FileDownload,
  QueryResolvers,
  QueryWastesRegistryXlsArgs
} from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getFileDownload } from "../../../common/fileDownload";
import { DownloadHandler } from "../../../routers/downloadRouter";
import { getRegistryFileName } from "../../filename";
import * as Excel from "exceljs";
import { wasteFormatter, wastesReader } from "../../streams";
import { getXlsxHeaders } from "../../columns";
import { searchBsds } from "../../elastic";
import { GraphQLContext } from "../../../types";
import { Permission, checkUserPermissions } from "../../../permissions";
import { UserInputError } from "../../../common/errors";
import { TotalHits } from "@elastic/elasticsearch/api/types";

export const wastesRegistryXlsDownloadHandler: DownloadHandler<QueryWastesRegistryXlsArgs> =
  {
    name: "wastesRegistryXls",
    handler: (_, res, args) => {
      const reader = wastesReader({
        registryType: args.registryType,
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
  const user = checkIsAuthenticated(context);
  for (const siret of args.sirets) {
    await checkUserPermissions(
      user,
      [siret].filter(Boolean),
      Permission.RegistryCanRead,
      `Vous n'êtes pas autorisé à accéder au registre de l'établissement portant le n°SIRET ${siret}`
    );
  }
  const hits = await searchBsds(args.registryType, args.sirets, args.where, {
    size: 1,
    sort: [{ id: "ASC" }]
  });

  if ((hits.total as TotalHits).value === 0) {
    throw new UserInputError(
      "Aucune donnée à exporter sur la période sélectionnée"
    );
  }
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
