import fs from "fs";
import path from "path";
import { logger } from "@td/logger";
import * as ExcelJS from "exceljs";
import {
  getFormRepository,
  runInTransaction,
  getFormOrFormNotFound,
  validateGroupement,
  InitialFormFractionInput
} from "back";
import { prisma } from "@td/prisma";

type Row = {
  nextFormId: string;
  initialFormIds: string[];
};

async function loadExcelData(filePath: string) {
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.readFile(filePath);
  } catch (error) {
    logger.error(
      `Erreur lors de la lecture du fichier Excel : ${error.message}`
    );
    process.exit(1);
  }
  const worksheet = workbook.worksheets[0];
  const rows: Array<Row> = [];
  worksheet.eachRow((row, rowNumber) => {
    // Ignorer l'en-tête
    if (rowNumber > 1 && row?.cellCount) {
      const nextFormId = row.getCell(1) as unknown as string;
      const cell2 = row.getCell(2) as unknown as string;
      const initialFormIds = cell2.split ? cell2.split(",") : [];
      rows.push({ nextFormId, initialFormIds });
    }
  });
  return rows;
}

export async function run() {
  const pathXlsx = path.join(
    __dirname,
    "..",
    "fix-appendix2-caktus-042024.xlsx"
  );
  const user = { id: "support-td", authType: "script" };
  if (!fs.existsSync(pathXlsx)) {
    logger.info(`Missing file ${pathXlsx}, aborting script`);
  } else {
    const rows = await loadExcelData(pathXlsx);
    await runInTransaction(async transaction => {
      const formRepository = getFormRepository(user as any, transaction);
      for (const row of rows) {
        try {
          const nextForm = await getFormOrFormNotFound({ id: row.nextFormId });
          const initialForms = await prisma.form.findMany({
            where: { id: { in: row.initialFormIds } }
          });

          const grouping: InitialFormFractionInput[] = initialForms.map(f => {
            return {
              form: { id: f.id },
              quantity: f.quantityReceived?.toNumber()
            };
          });

          const formFractions = await validateGroupement(nextForm, grouping);
          const existingFormFractions = await prisma.form
            .findUnique({ where: { id: nextForm.id } })
            .grouping({ include: { initialForm: true } });

          const existingAppendixForms =
            existingFormFractions?.map(({ initialForm }) => initialForm) ?? [];

          await formRepository.setAppendix2({
            form: nextForm,
            appendix2: formFractions!,
            currentAppendix2Forms: existingAppendixForms
          });
        } catch {
          continue;
        }
      }
      console.log("Insertion et mise à jour terminées.");
    });
  }
}
