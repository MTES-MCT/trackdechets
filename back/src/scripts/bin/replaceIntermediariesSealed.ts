import * as xlsx from "xlsx";
import { Command } from "commander";
import { prisma } from "@td/prisma";
import { Prisma } from "@prisma/client";
import { sirenifyFormCreateInput } from "../../forms/sirenify";

function readXlsxFile(
  filePath: string
): { bsd_readable_id: string; siret: string }[] {
  try {
    const workbook = xlsx.readFile(filePath);
    const worksheet = workbook.Sheets["Sheet1"]; // Replace with your sheet name
    const data = xlsx.utils.sheet_to_json(worksheet);
    return data.map((row: any) => ({
      initialFormId: row["B"], // Assuming column B contains bsd_readable_id
      nextFormId: row["C"] // Assuming column C contains siret
    }));
  } catch (err) {
    console.error(`Error reading XLSX file: ${err}`);
    throw err; // Or handle differently based on your requirements
  }
}

const program = new Command();

program
  .command("replace")
  .option("-f, --file <path>", "Path to the XLSX file")
  .option("-d, --delete <SIRET>", "Database hostname", "12345678909876")
  .option("-a, --add <SIRET>", "12345678909876")
  .action(async (bsd_readable_id, options) => {
    try {
      const rows = readXlsxFile(options.file);
      for (const bsd_readable_id of rows) {
        await updateFormIntermediaries(
          bsd_readable_id["initialFormId"],
          options
        );
        await updateFormIntermediaries(bsd_readable_id["nextFormId"], options);
      }
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  });

async function updateFormIntermediaries(bsd_readable_id: string, options: any) {
  try {
    const form = await prisma.form.findUniqueOrThrow({
      where: {
        readableId: bsd_readable_id
      },
      include: {
        intermediaries: true
      }
    });
    const [formIntermediary] =
      await prisma.intermediaryFormAssociation.findMany({
        where: {
          formId: form.id,
          siret: options.delete as string
        }
      });
    const newFormInput: Prisma.FormUpdateInput = {
      intermediaries: {
        delete: { id: formIntermediary.id },
        create: [
          {
            name: "CYCLEVIA",
            contact: "contact",
            siret: options.add
          }
        ]
      }
    };
    const sirenified = await sirenifyFormCreateInput(newFormInput, []);

    // Passe par la méthode update du form repository pour logguer l'event, déclencher le
    // réindex et recalculer le champ dénormalisé `transporterSirets`
    await prisma.form.update({
      where: { id: form.id },
      data: sirenified
    });
  } catch (err) {
    console.error(err);
  }
}
