import { Response, Request } from "express";
import * as Excel from "exceljs";
import { format } from "@fast-csv/format";
import { QueryFormsRegisterArgs } from "../../generated/graphql/types";
import { formsReader, formsTransformer } from "./streams";
import { formsWhereInput } from "./where-inputs";
import { formFieldsSelection } from "./fragments";
import { getExportsFileName } from "./filename";
import { getXlsxHeaders } from "./columns";

/**
 * Download handler for forms register
 */
export async function downloadFormsRegister(
  _req: Request,
  res: Response,
  args: QueryFormsRegisterArgs
) {
  args.exportFormat = args.exportFormat || "CSV";
  args.exportType = args.exportType || "ALL";

  const whereInput = formsWhereInput(
    args.exportType,
    args.sirets,
    args.startDate ? new Date(args.startDate) : null,
    args.endDate ? new Date(args.endDate) : null,
    args.wasteCode
  );

  const fieldsSelection = formFieldsSelection(args.exportType);

  const reader = formsReader({ whereInput, fieldsSelection });

  const filename = getExportsFileName(
    args.exportType,
    args.sirets,
    args.wasteCode
  );

  switch (args.exportFormat) {
    case "CSV": {
      res.set("Content-disposition", `attachment; filename=${filename}.csv`);
      res.set("Content-Type", "text/csv");
      res.set("Transfer-Encoding", "chunked");
      const csvStream = format({ headers: true, delimiter: ";" });
      const transformer = formsTransformer({ useLabelAsKey: true });
      reader.pipe(transformer).pipe(csvStream).pipe(res);
      break;
    }
    case "XLSX": {
      res.set("Content-Disposition", `attachment; filename=${filename}.xlsx`);
      const contenType =
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      res.set("Content-Type", contenType);
      res.set("Transfer-Encoding", "chunked");
      const workbook = new Excel.stream.xlsx.WorkbookWriter({ stream: res });
      const worksheet = workbook.addWorksheet("registre");
      const transformer = formsTransformer();
      reader.pipe(transformer);
      transformer.on("data", form => {
        if (worksheet.columns === null) {
          // write headers if not present
          worksheet.columns = getXlsxHeaders(form);
        }
        worksheet.addRow(form, "n").commit();
      });

      transformer.on("end", () => {
        worksheet.commit();
        workbook.commit();
      });

      break;
    }
  }
}
