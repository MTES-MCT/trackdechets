import fs from "fs";
import path from "path";
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

function importJsonData(filePath): Row[] {
  try {
    const jsonContent = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(jsonContent);
    return data as unknown as Row[];
  } catch (error) {
    console.error(
      `Erreur lors de l'importation des données : ${error.message}`
    );
    return [];
  }
}

export async function run() {
  const pathJSON = path.join(
    __dirname,
    "..",
    "fix-appendix2-caktus-042024.json"
  );
  const user = { id: "support-td", authType: "script" };
  const rows = importJsonData(pathJSON);
  console.info(`Starting to fix ${rows.length} BSDD`);
  for (const row of rows) {
    await runInTransaction(async prisma => {
      const { updateAppendix2Forms } = getFormRepository(user as any, prisma);
      let nextForm = await getFormOrFormNotFound({ id: row.nextFormId });
      // Fix emitterType for validation
      nextForm = await prisma.form.update({
        where: {
          id: row.nextFormId
        },
        data: {
          emitterType: "APPENDIX2"
        }
      });
      const existingFormFractions = await prisma.form
        .findUnique({ where: { id: nextForm.id } })
        .grouping({ include: { initialForm: true } });

      const initialFormIdsFiltered = (await Promise.all(row.initialFormIds.map((id) => prisma.form.findUnique({
        where: {
          id
        },
        select: {
          id: true
        }
      })))).map((form) => form?.id as string).filter((f) => !!f);

      // Fix status for validation
      await prisma.form.updateMany({
        where: { id: { in: initialFormIdsFiltered } },
        data: {
          status: "GROUPED"
        }
      });
      const initialForms = await prisma.form.findMany({
        where: { id: { in: initialFormIdsFiltered } }
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

      console.log(`FormGroupement To Create = ${formGroupementToCreate.length}`);

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

        console.log(`FormGroupement To Update = ${validUpdates.length}`);

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
            ...initialForms.map(form => form.id)
          ])
        ];
        const dirtyForms = await prisma.form.findMany({
          where: { id: { in: dirtyFormIds } },
          include: { forwardedIn: true }
        });
        console.log(`updateAppendix2Forms for ${dirtyForms.length} Form`);
        await updateAppendix2Forms(dirtyForms);
      }
    });
  }

  console.info("Insertion et mise à jour terminées.");
}
