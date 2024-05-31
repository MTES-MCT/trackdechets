import { getFileDownload } from "../../../common/fileDownload";
import { checkIsAuthenticated } from "../../../common/permissions";
import { QueryResolvers } from "../../../generated/graphql/types";
import { DownloadHandler } from "../../../routers/downloadRouter";
import { getCompaniesExportFileName } from "../../export/filename";
import { myCompaniesReader, userInCompanyFormatter } from "../../export/stream";
import { format } from "@fast-csv/format";

export type MyCompaniesCsvArgs = { userId: string };

export const myCompaniesCsvDownloadHandler: DownloadHandler<MyCompaniesCsvArgs> =
  {
    name: "myCompaniesCsv",
    handler: (_, res, args) => {
      const reader = myCompaniesReader({
        userId: args.userId,
        chunk: 100
      });
      const filename = getCompaniesExportFileName();
      res.set("Content-disposition", `attachment; filename=${filename}.csv`);
      res.set("Content-Type", "text/csv");
      res.set("Transfer-Encoding", "chunked");
      const csvStream = format({ headers: true, delimiter: ";" });
      const transformer = userInCompanyFormatter({ useLabelAsKey: true });
      reader.pipe(transformer).pipe(csvStream).pipe(res);
    }
  };

const myCompaniesCsvResolver: QueryResolvers["myCompaniesCsv"] = async (
  _parent,
  args,
  context
) => {
  const user = checkIsAuthenticated(context);
  return getFileDownload({
    handler: myCompaniesCsvDownloadHandler.name,
    params: { userId: user.id }
  });
};

export default myCompaniesCsvResolver;
