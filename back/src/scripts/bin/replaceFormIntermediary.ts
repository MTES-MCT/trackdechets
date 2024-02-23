import * as xlsx from "xlsx";
import { program } from "commander";
import { prisma } from "@td/prisma";
import { Prisma } from "@prisma/client";
import { getFormRepository } from "../../forms/repository";

function readXlsxFile(
  filePath: string
): { bsdReadableId: string; siret: string }[] {
  try {
    const workbook = xlsx.readFile(filePath);
    const worksheet = workbook.Sheets["Feuil1"];
    const data = xlsx.utils.sheet_to_json(worksheet);
    return data.map((row: any) => ({
      initialFormId: row["BSD dédié Tournée"], // column B contains initialForm readableId
      nextFormId: row["BSDD / BSD Annexe 1"] // column C contains nextForm readableId
    }));
  } catch (err) {
    console.error(`Error reading XLSX file: ${err}`);
    throw err;
  }
}

program
  .option("-f, --file <file>", "file.xlsx with SIRET in column B and C")
  .option("-d, --delete <SIRET>", "12345678909876")
  .option("-a, --add <SIRET>", "12345678909876")
  .action(async options => {
    async function updateFormIntermediaries(
      bsdReadableId: string,
      addSiret: string,
      deleteSiret: string
    ) {
      if (!bsdReadableId || !addSiret || !deleteSiret) {
        console.log(`missing data, skipping BSDD ${bsdReadableId}`)
        return;
      }
      let form;
      try {
        form = await prisma.form.findUniqueOrThrow({
          where: {
            readableId: bsdReadableId
          },
          select: { id: true }
        });
      } catch (err) {
        console.error(`BSDD ${bsdReadableId} was not found`, err);
        throw err;
      }
        const [formIntermediary] =
          await prisma.intermediaryFormAssociation.findMany({
            where: {
              formId: form.id,
              siret: deleteSiret
            }
          });
        if (!formIntermediary) {
          console.log(`FormIntermediary NOT found, skipping BSDD ${bsdReadableId}`)
          return;
        }
        const newFormInput: Prisma.FormUpdateInput = {
          intermediaries: {
            delete: { id: formIntermediary.id },
            create: [
              {
                name: "CYCLEVIA",
                contact: "directeur CYCLEVIA",
                siret: addSiret,
                address:
                  "4 RUE JACQUES DAGUERRE IMMEUBLE CONCORDE 92500 RUEIL-MALMAISON"
              }
            ]
          }
        };
        // Passe par la méthode update du form repository pour logguer l'event, déclencher le
        // réindex et recalculer le champ dénormalisé `transporterSirets`
        const user = { id: "support-td", authType: "script" };
        const { update } = getFormRepository(user as any);
      try {
        await update({ id: form.id }, newFormInput);
      } catch (err) {
        console.error(`Error during update`, err);
        throw err;
      }
    }
    console.log(`Starting script`);
    const rows = readXlsxFile(options.file);
    for (const bsdReadableId of rows) {
      try {
        await updateFormIntermediaries(
          bsdReadableId["initialFormId"],
          options.add,
          options.delete
        );
        console.log(
          `Mis à jour BSDD ${bsdReadableId["initialFormId"]}, suppression ${options.delete} et ajout ${options.add}`
        );
      } catch (err) {
        console.error(err);
      }
      try {
        await updateFormIntermediaries(
          bsdReadableId["nextFormId"],
          options.add,
          options.delete
        );
        console.log(
          `Mis à jour BSDD ${bsdReadableId["nextFormId"]}, suppression ${options.delete} et ajout ${options.add}`
        );
      } catch (err) {
        console.error(err);
      }
    }
  });

program.parse(process.argv);
