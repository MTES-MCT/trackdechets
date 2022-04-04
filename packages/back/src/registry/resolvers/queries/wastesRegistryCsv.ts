import {
  FileDownload,
  QueryResolvers,
  QueryWastesRegistryCsvArgs
} from "@trackdechets/codegen/src/back.gen";
import { checkIsAuthenticated } from "../../../common/permissions";
import { checkIsCompanyMember } from "../../../users/permissions";
import { getFileDownload } from "../../../common/fileDownload";
import { DownloadHandler } from "../../../routers/downloadRouter";
import { getRegistryFileName } from "../../filename";
import { format } from "@fast-csv/format";
import { wasteFormatter, wastesReader } from "../../streams";
import { searchBsds } from "../../elastic";
import { UserInputError } from "apollo-server-express";
import { GraphQLContext } from "../../../types";

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
    await checkIsCompanyMember({ id: user.id }, { siret });
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
