import {
  FileDownload,
  QueryResolvers,
  QueryWastesRegistryCsvArgs
} from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getFileDownload } from "../../../common/fileDownload";
import { DownloadHandler } from "../../../routers/downloadRouter";
import { getRegistryFileName } from "../../filename";
import { format } from "@fast-csv/format";
import { wasteFormatter, wastesReader } from "../../streams";
import { searchBsds } from "../../elastic";
import { GraphQLContext } from "../../../types";
import { Permission, checkUserPermissions } from "../../../permissions";
import { UserInputError } from "../../../common/errors";

export const wastesRegistryCsvDownloadHandler: DownloadHandler<QueryWastesRegistryCsvArgs> =
  {
    name: "wastesRegistryCsv",
    handler: (_, res, args) => {
      const reader = wastesReader({
        registryType: args.registryType,
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
  if (hits.total === 0) {
    throw new UserInputError(
      "Aucune donnée à exporter sur la période sélectionnée"
    );
  }
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
