import fs from "fs";
import path from "path";
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
    console.error(
      `Erreur lors de la lecture du fichier Excel : ${error.message}`
    );
    process.exit(1);
  }
  const worksheet = workbook.worksheets[0];
  const rows: Array<Row> = [];
  let count = 0;
  worksheet.eachRow((row, rowNumber) => {
    // Ignorer l'en-tête
    if (rowNumber > 1 && row?.cellCount) {
      const nextFormId = row.getCell(1) as unknown as string;
      if (!nextFormId) {
        console.info(`Parsed ${count} lines of XLSX`);
        return rows;
      }
      const cell2 = row.getCell(2) as unknown as string;
      const initialFormIds = cell2.split ? cell2.split(",") : [];
      rows.push({ nextFormId, initialFormIds });
      count++;
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
    console.info(`Missing file ${pathXlsx}, aborting script`);
  } else {
    const rows = await loadExcelData(pathXlsx);

    for (const row of rows) {
      await runInTransaction(async prisma => {
        const { updateAppendix2Forms } = getFormRepository(user as any, prisma);

        const nextForm = await getFormOrFormNotFound({ id: row.nextFormId });

        const existingFormFractions = await prisma.form
          .findUnique({ where: { id: nextForm.id } })
          .grouping({ include: { initialForm: true } });

        const initialForms = await prisma.form.findMany({
          where: { id: { in: row.initialFormIds } }
        });

        const grouping = initialForms.map(f => {
          return {
            form: { id: f.id }
          };
        });

        const formFractions = await validateGroupement(nextForm, grouping);

        const existingAppendixForms =
          existingFormFractions?.map(({ initialForm }) => initialForm) ?? [];

        const formGroupementToCreate: {
          nextFormId: string;
          initialFormId: string;
          quantity: number;
        }[] = [];

        const formGroupementToUpdate: {
          initialFormId: string;
          quantity: number;
        }[] = [];

        for (const { form: initialForm, quantity } of formFractions) {
          if (
            existingAppendixForms &&
            existingAppendixForms.map(f => f.id).includes(initialForm.id)
          ) {
            formGroupementToUpdate.push({
              initialFormId: initialForm.id,
              quantity
            });
          } else {
            formGroupementToCreate.push({
              nextFormId: nextForm.id,
              initialFormId: initialForm.id,
              quantity
            });
          }
        }

        console.log(`formGroupementToCreate = ${formGroupementToCreate.length}`);

        if (formGroupementToCreate.length > 0) {
          await prisma.formGroupement.createMany({
            data: formGroupementToCreate
          });
        }

        if (formGroupementToUpdate.length > 0) {
          // We compare existing groupements with the updates. If the quantity hasn't changed, we skip the update
          const existingGroupements = await prisma.formGroupement.findMany({
            where: {
              nextFormId: nextForm.id
            }
          });
          const validUpdates = formGroupementToUpdate.filter(update => {
            const existingGroupement = existingGroupements.find(
              grp => grp.initialFormId === update.initialFormId
            );
            return existingGroupement?.quantity !== update.quantity;
          });

          console.log(`formGroupementToUpdate = ${validUpdates.length}`);

          await Promise.all(
            validUpdates.map(({ initialFormId, quantity }) =>
              prisma.formGroupement.updateMany({
                where: {
                  nextFormId: nextForm.id,
                  initialFormId
                },
                data: { quantity }
              })
            )
          );
        }

        if (formGroupementToCreate.length) {
          const dirtyFormIds = [
            ...new Set([
              ...(existingAppendixForms?.map(f => f.id) ?? []),
              ...initialForms.map((form) => form.id)
            ])
          ];
          const dirtyForms = await prisma.form.findMany({
            where: { id: { in: dirtyFormIds } },
            include: { forwardedIn: true }
          });

          await updateAppendix2Forms(dirtyForms);
        }
      });
    }

    console.info("Insertion et mise à jour terminées.");
  }
}
