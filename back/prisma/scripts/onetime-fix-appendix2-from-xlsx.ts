import { prisma } from "@td/prisma";
import { registerUpdater, Updater } from "./helper/helper";
import buildUpdateAppendix2Forms from "../../src/forms/repository/form/updateAppendix2Forms";
import * as ExcelJS from "exceljs";

async function loadExcelData(filePath: string) {
  const workbook = new ExcelJS.Workbook();
  try {
      await workbook.xlsx.readFile(filePath);
  } catch (error) {
      console.error(`Erreur lors de la lecture du fichier Excel : ${error.message}`);
      process.exit(1); // Sortir du script avec un code d'erreur
  }
  const worksheet = workbook.worksheets[0];
  const rows = [];
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
    allInitialFormIds = [...allInitialFormIds, ...row.initialFormIds]; // Collecter tous les initialFormIds
    for (let i = 0; i < row.initialFormIds.length; i++) {
      const initialFormId = row.initialFormIds[i];
      const quantity = row.quantities[i];
      await prisma.formGroupement.create({
        data: {
          nextFormId: row.nextFormId,
          initialFormId,
          quantity,
          id: `${row.nextFormId}-${initialFormId}` // Générer un ID unique pour chaque entrée
        }
      });
    }
  }
  return allInitialFormIds;
}
// Supposons que `FormForUpdateAppendix2FormsInclude` et `buildUpdateAppendix2Forms` sont définis ailleurs dans votre code
async function updateDirtyForms(dirtyFormIds: string[]) {
  const dirtyForms = await prisma.form.findMany({
    where: { id: { in: dirtyFormIds } },
    include: {
      forwardedIn: true
    }
  });
  const user = { id: "support-td", authType: "script" };
  const updateAppendix2Forms = buildUpdateAppendix2Forms({ prisma, user });
  await updateAppendix2Forms(dirtyForms);
}

@registerUpdater(
  "Update FinalOperation table",
  "Update the list of final operation code and quantity in the database",
  true
)
export class UpdateFinalOperationUpdater implements Updater {
  async run() {



    const filePath = "chemin/vers/votre/fichier.xlsx";
    const rows = await loadExcelData(filePath);
    const dirtyFormIds = await insertFormGroupements(rows);
    await updateDirtyForms(dirtyFormIds);
    console.log("Insertion et mise à jour terminées.");
  }
}

