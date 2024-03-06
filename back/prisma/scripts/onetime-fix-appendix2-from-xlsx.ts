import fs from "fs";
import path from "path";
import { prisma } from "@td/prisma";
import { logger } from "@td/logger";
import { registerUpdater, Updater } from "./helper/helper";
import * as ExcelJS from "exceljs";
import { getFormRepository } from "../../src/forms/repository";

async function loadExcelData(filePath: string) {
  const workbook = new ExcelJS.Workbook();
  try {
      await workbook.xlsx.readFile(filePath);
  } catch (error) {
      logger.error(`Erreur lors de la lecture du fichier Excel : ${error.message}`);
      process.exit(1);
  }
  const worksheet = workbook.worksheets[0];
  const rows: Array<{ nextFormId: string; initialFormIds: string[]; quantities: number[]; }> = [];
  worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) { // Ignorer l'en-tête
          const nextFormId = row.getCell(1).value as string;
          const initialFormIds = (row.getCell(2).value as string).split(',');
          const quantities = (row.getCell(3).value as string).split(',').map(q => parseFloat(q));
          rows.push({ nextFormId, initialFormIds, quantities });
      }
  });
  return rows;
}

async function insertFormGroupements(
  rows: Array<{
    nextFormId: string;
    initialFormIds: string[];
    quantities: number[];
  }>
) {
  let allInitialFormIds: string[] = [];
  for (const row of rows) {
    // Collecter tous les initialFormIds
    allInitialFormIds = [...allInitialFormIds, ...row.initialFormIds];
    for (let i = 0; i < row.initialFormIds.length; i++) {
      const initialFormId = row.initialFormIds[i];
      const quantity = row.quantities[i];
      await prisma.formGroupement.create({
        data: {
          nextFormId: row.nextFormId,
          initialFormId,
          quantity
        }
      });
    }
  }
  return allInitialFormIds;
}

async function updateDirtyForms(dirtyFormIds: string[]) {
  const dirtyForms = await prisma.form.findMany({
    where: { id: { in: dirtyFormIds } },
    include: {
      forwardedIn: true
    }
  });
  const user = { id: "support-td", authType: "script" };
  const formRepository = getFormRepository(user as any);
  await formRepository.updateAppendix2Forms(dirtyForms);
}

@registerUpdater(
  "Update FinalOperation table",
  "Update the list of final operation code and quantity in the database",
  true
)
export class UpdateFinalOperationUpdater implements Updater {
  async run() {
    const pathXlsx = path.join(__dirname, "fix-appendix2.xlsx");
    if (!fs.existsSync(pathXlsx)) {
      logger.error(
        `Missing file ${pathXlsx}, aborting script`
      );
      process.exit(1);
    }
    const rows = await loadExcelData(pathXlsx);
    const dirtyFormIds = await insertFormGroupements(rows);
    await updateDirtyForms(dirtyFormIds);
    console.log("Insertion et mise à jour terminées.");
  }
}
