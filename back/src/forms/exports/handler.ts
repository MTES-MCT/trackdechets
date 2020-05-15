import { Response } from "express";
import Excel from "exceljs";
import { format } from "@fast-csv/format";
import { QueryFormsRegisterArgs } from "../../generated/graphql/types";
import { formsReader, formsTransformer } from "./streams";
import { formsWhereInput } from "./where-inputs";
import { formFragment } from "./fragments";

class MissingArgError extends Error {
  constructor(arg: string) {
    super(`Couldn't generate exports because of missing ${arg} argument`);
  }
}

/**
 * Download handler for forms register
 */
export async function downloadFormsRegister(
  res: Response,
  args: QueryFormsRegisterArgs
) {
  if (!args.exportFormat) {
    throw new MissingArgError("exportFormat");
  }

  if (!args.sirets) {
    throw new MissingArgError("siret");
  }

  if (!args.exportType) {
    throw new MissingArgError("exportType");
  }

  const whereInput = formsWhereInput(
    args.exportType,
    args.sirets,
    args.startDate,
    args.endDate,
    args.wasteCode
  );

  const fragment = formFragment(args.exportType);

  const reader = formsReader({ whereInput, fragment });
  const transformer = formsTransformer();

  switch (args.exportFormat) {
    case "CSV": {
      res.set("Content-disposition", "attachment; filename=export.csv");
      res.set("Content-Type", "text/csv");
      res.set("Transfer-Encoding", "chunked");
      const csvStream = format({ headers: true, delimiter: ";" });
      reader.pipe(transformer).pipe(csvStream).pipe(res);
      break;
    }
    case "XLSX": {
      res.set("Content-Disposition", "attachment; filename=export.xlsx");
      const contenType =
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      res.set("Content-Type", contenType);
      res.set("Transfer-Encoding", "chunked");
      const workbook = new Excel.stream.xlsx.WorkbookWriter({ stream: res });
      const worksheet = workbook.addWorksheet("registre");

      reader.pipe(transformer);
      let hasHeader = false;
      transformer.on("data", form => {
        if (!hasHeader) {
          worksheet.addRow(Object.keys(form), "n").commit();
          hasHeader = true;
        }
        worksheet.addRow(Object.values(form), "n").commit();
      });

      transformer.on("end", () => {
        worksheet.commit();
        workbook.commit();
      });

      break;
    }
  }
}
