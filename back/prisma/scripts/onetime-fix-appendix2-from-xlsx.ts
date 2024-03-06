import fs from "fs";
import path from "path";
import { prisma } from "@td/prisma";
import { logger } from "@td/logger";
import { registerUpdater, Updater } from "./helper/helper";
import * as ExcelJS from "exceljs";
import { getFormRepository } from "../../src/forms/repository";
import { FormForUpdateAppendix2FormsInclude } from "../../src/forms/repository/form/updateAppendix2Forms";

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
  const rows: Array<{
    nextFormId: string;
    initialFormIds: string[];
    quantities: number[];
  }> = [];
  worksheet.eachRow((row, rowNumber) => {
    // Ignorer l'en-tête
    if (rowNumber > 1 && row?.cellCount) {
      const cell2 = row.getCell(2) as unknown as string;
      const cell3 = row.getCell(3) as unknown as string;
      const nextFormId = row.getCell(1) as unknown as string;
      const initialFormIds = cell2.split ? cell2.split(",") : [];
      const quantities = (cell3.split ? cell3.split(",") : [])
        .map(q => parseFloat(q));
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
  for (const row of rows) {
    const initialFormIdsSet = [...new Set(row.initialFormIds)];
    for (let i = 0; i < initialFormIdsSet.length; i++) {
      const initialFormId = initialFormIdsSet[i];
      const quantity = row.quantities[i];
      logger.info(`Creating FormGroupement for nextFormId ${row.nextFormId} and initialFormId ${initialFormId} with quantity ${quantity}`);
      await prisma.formGroupement.create({
        data: {
          nextFormId: row.nextFormId,
          initialFormId,
          quantity
        }
      });
    }
    await updateDirtyForms(initialFormIdsSet);
  }
}

async function updateDirtyForms(dirtyFormIds: string[]) {
  const dirtyForms = await prisma.form.findMany({
    where: { id: { in: dirtyFormIds } },
    include: FormForUpdateAppendix2FormsInclude
  });
  const user = { id: "support-td", authType: "script" };
  const formRepository = getFormRepository(user as any);
  try {
    logger.info(`Updating ${dirtyForms.length} BSDD`);
    await formRepository.updateAppendix2Forms(dirtyForms);
  } catch (err) {
    logger.error(err);
  }
}

@registerUpdater(
  "Update Grouped BSDD for Caktus",
  "Add forgotten appendix2 BSDD in the database",
  true
)
export class UpdateCaktusGroupingOperationUpdater implements Updater {
  async run() {
    const pathXlsx = path.join(__dirname, "fix-appendix2-caktus-042024.xlsx");
    if (!fs.existsSync(pathXlsx)) {
      logger.info(`Missing file ${pathXlsx}, aborting script`);
    } else {
      const rows = await loadExcelData(pathXlsx);
      await insertFormGroupements(rows);
      console.log("Insertion et mise à jour terminées.");
    }
  }
}
