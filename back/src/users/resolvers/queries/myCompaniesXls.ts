import { prisma } from "@td/prisma";
import { getFileDownload } from "../../../common/fileDownload";
import { checkIsAuthenticated } from "../../../common/permissions";
import type { QueryResolvers } from "@td/codegen-back";
import { DownloadHandler } from "../../../routers/downloadRouter";
import { getXlsxHeaders } from "../../export/columns";
import { getCompaniesExportFileName } from "../../export/filename";
import { myCompaniesReader, userInCompanyFormatter } from "../../export/stream";
import * as Excel from "exceljs";

export type MyCompaniesXlsArgs = { userId: string };

export const myCompaniesXlsDownloadHandler: DownloadHandler<MyCompaniesXlsArgs> =
  {
    name: "myCompaniesXls",
    handler: async (_, res, { userId }) => {
      // Liste tous les établissements auxquels appartient l'utilisateur
      const associations = await prisma.companyAssociation.findMany({
        where: { userId },
        select: { companyId: true }
      });
      const companyIds = associations.map(a => a.companyId);
      const reader = myCompaniesReader({
        companyIds,
        chunk: 100
      });

      const filename = getCompaniesExportFileName();
      res.set("Content-Disposition", `attachment; filename=${filename}.xlsx`);
      const contentType =
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      res.set("Content-Type", contentType);
      res.set("Transfer-Encoding", "chunked");
      const workbook = new Excel.stream.xlsx.WorkbookWriter({
        stream: res
      });
      const worksheet = workbook.addWorksheet("etablissements");
      const transformer = userInCompanyFormatter();
      reader.pipe(transformer);
      transformer.on("data", userInCompany => {
        if (worksheet.columns === null) {
          // write headers if not present
          worksheet.columns = getXlsxHeaders();
        }

        worksheet.addRow(userInCompany, "n").commit();
      });

      transformer.on("end", () => {
        worksheet.commit();
        workbook.commit();
      });
    }
  };

const myCompaniesXlsResolver: QueryResolvers["myCompaniesXls"] = async (
  _parent,
  args,
  context
) => {
  const user = checkIsAuthenticated(context);
  return getFileDownload({
    handler: myCompaniesXlsDownloadHandler.name,
    params: { userId: user.id }
  });
};

export default myCompaniesXlsResolver;
