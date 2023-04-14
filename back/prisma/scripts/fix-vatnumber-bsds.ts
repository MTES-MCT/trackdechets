import fs from "fs";
import path from "path";
import prompts from "prompts";
import { Updater, registerUpdater } from "./helper/helper";
import prisma from "../../src/prisma";
import { Form } from "@prisma/client";

@registerUpdater(
  "Clean BSD SIRET and VAT numbers from bad characters",
  "Clean BSD SIRET and VAT numbers",
  false
)
export class FixBSDVatUpdater implements Updater {
  async run() {
    try {
      const forms: Form[] = await prisma.$queryRawUnsafe(
        `select "id", "transporterCompanyVatNumber", "transporterCompanySiret", "transportersSirets" from default$default."Form" as f where f."transporterCompanyVatNumber" ~ '(\\-|\\.|\\s)'`
      );

      const filePath = path.join(
        __dirname,
        "..",
        "..",
        "fix-vatnumber-bsds.csv"
      );
      try {
        // save to CSV all modified Forms
        const lines = forms.map(f =>
          [f.id, f.transporterCompanyVatNumber].join(",")
        );
        fs.writeFileSync(filePath, `${lines.join("\r\n")}`);
      } catch (err) {
        console.error(`Error saving CSV log file ${filePath}`, err);
        process.exit(1);
      }

      const { value } = await prompts({
        type: "confirm",
        name: "value",
        message: `Confirm to hard update ${forms.length} Forms ?`,
        initial: false
      });
      if (!value) {
        process.exit(0);
      }

      for (const formData of forms) {
        const {
          transporterCompanyVatNumber,
          transporterCompanySiret,
          transportersSirets
        } = formData;

        try {
          const cleanVat = !!transporterCompanyVatNumber
            ? transporterCompanyVatNumber.replace(/[\W_]+/g, "")
            : "";
          let cleanSiret = transporterCompanySiret;
          // restrict to TVA copied to SIRET
          if (
            !!transporterCompanySiret &&
            transporterCompanyVatNumber === transporterCompanySiret
          ) {
            cleanSiret = transporterCompanySiret.replace(/[\W_]+/g, "");
          }
          let cleanTransportersSirets: string[] = [];
          if (!!transportersSirets) {
            cleanTransportersSirets = transportersSirets.map(siret => {
              if (siret === transporterCompanySiret) return cleanSiret;
              else return siret;
            }).filter(Boolean);
          }

          await prisma.form.update({
            data: {
              ...(!!transporterCompanyVatNumber
                ? { transporterCompanyVatNumber: cleanVat }
                : {}),
              ...(!!transporterCompanySiret &&
              transporterCompanyVatNumber === transporterCompanySiret
                ? {
                    transporterCompanySiret: cleanSiret
                  }
                : {}),
              ...(!!transportersSirets
                ? { transportersSirets: cleanTransportersSirets }
                : {})
            },
            where: { id: formData.id }
          });
        } catch (err) {
          console.error(
            `Failed fixing Form.transporterCompanyVatNumber on Form ${formData.id}`,
            err
          );
        }
      }
    } catch (err) {
      console.error("☠ Something went wrong during the update of Form", err);
      throw new Error();
    }
    // BSDA
    try {
      const bsda = await prisma.bsda.findUnique({
        where: { id: "BSDA-20220323-TXK0A50KQ" }
      });
      if (bsda) {
        await prisma.bsda.update({
          data: {
            transporterCompanyVatNumber:
              bsda.transporterCompanyVatNumber!.replace(/[\W_]+/g, ""),
            ...(bsda.transporterCompanySiret &&
            bsda.transporterCompanyVatNumber === bsda.transporterCompanySiret
              ? {
                  transporterCompanySiret: bsda.transporterCompanySiret.replace(
                    /[\W_]+/g,
                    ""
                  )
                }
              : {})
          },
          where: { id: "BSDA-20220323-TXK0A50KQ" }
        });
        console.log(`Fixed BSDA ${bsda.id}`);
      }
    } catch (err) {
      console.error("☠ Something went wrong during the update of Bsda", err);
      throw new Error();
    }
    // BSVHU
    try {
      const bsvhus = await prisma.bsvhu.findMany({
        where: {
          OR: [
            { id: "VHU-20221124-BZ6H40FMW" },
            { id: "VHU-20220401-M8XSG3KCK" }
          ]
        }
      });
      for (const bsvhuData of bsvhus) {
        if (!bsvhuData.transporterCompanyVatNumber) {
          continue;
        }
        try {
          await prisma.bsvhu.update({
            data: {
              transporterCompanyVatNumber:
                bsvhuData.transporterCompanyVatNumber.replace(/[\W_]+/g, ""),
              ...(bsvhuData.transporterCompanySiret &&
              bsvhuData.transporterCompanyVatNumber ===
                bsvhuData.transporterCompanySiret
                ? {
                    transporterCompanySiret:
                      bsvhuData.transporterCompanySiret.replace(/[\W_]+/g, "")
                  }
                : {})
            },
            where: { id: bsvhuData.id }
          });
          console.log(`Fixed BSVHU ${bsvhuData.id}`);
        } catch (err) {
          console.error(
            `Failed fixing bsvhu.transporterCompanyVatNumber on bsvhu ${bsvhuData.id}`,
            err
          );
        }
      }
    } catch (err) {
      console.error("☠ Something went wrong during the update of bsvhu", err);
      throw new Error();
    }
  }
}
