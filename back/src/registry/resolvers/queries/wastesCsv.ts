import {
  FileDownload,
  QueryResolvers,
  QueryWastesCsvArgs
} from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { checkIsCompanyMember } from "../../../users/permissions";
import { getFileDownload } from "../../../common/fileDownload";
import { DownloadHandler } from "../../../routers/downloadRouter";
import { getRegistryFileName } from "../../filename";
import { format } from "@fast-csv/format";
import { wasteFormatter, wastesReader } from "../../streams";
import { searchBsds } from "../../elastic";
import { UserInputError } from "apollo-server-core";
import { GraphQLContext } from "../../../types";

export const wastesCsvDownloadHandler: DownloadHandler<QueryWastesCsvArgs> = {
  name: "wastesCsv",
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

export async function wastesCsvResolverFn(
  args: QueryWastesCsvArgs,
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
    handler: wastesCsvDownloadHandler.name,
    params: args
  });
}

const wastesCsvResolver: QueryResolvers["wastesCsv"] = async (
  _,
  args,
  context
) => {
  return wastesCsvResolverFn(args, context);
};

export default wastesCsvResolver;
