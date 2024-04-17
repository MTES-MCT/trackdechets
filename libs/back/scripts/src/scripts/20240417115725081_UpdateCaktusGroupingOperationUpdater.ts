import fs from "fs";
import path from "path";
import { logger } from "@td/logger";
import * as ExcelJS from "exceljs";
import {
  getFormRepository,
  runInTransaction,
  getFormOrFormNotFound,
  validateGroupement
} from "back";

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

    for (const row of rows) {
      await runInTransaction(async prisma => {
        const { updateAppendix2Forms } = getFormRepository(user as any, prisma);

        const nextForm = await getFormOrFormNotFound({ id: row.nextFormId });
        const initialForms = await prisma.form.findMany({
          where: { id: { in: row.initialFormIds } }
        });

        const grouping = initialForms.map(f => {
          return {
            form: { id: f.id }
          };
        });

        const formFractions = await validateGroupement(nextForm, grouping);

        const formGroupementToCreate: {
          nextFormId: string;
          initialFormId: string;
          quantity: number;
        }[] = [];

        for (const { form: initialForm, quantity } of formFractions) {
          formGroupementToCreate.push({
            nextFormId: nextForm.id,
            initialFormId: initialForm.id,
            quantity: quantity
          });
        }

        if (formGroupementToCreate.length > 0) {
          await prisma.formGroupement.createMany({
            data: formGroupementToCreate
          });

          const dirtyFormIds = initialForms.map(f => f.id);

          const dirtyForms = await prisma.form.findMany({
            where: { id: { in: dirtyFormIds } },
            include: { forwardedIn: true }
          });

          await updateAppendix2Forms(dirtyForms);
        }
      });
    }

    console.log("Insertion et mise à jour terminées.");
  }
}
