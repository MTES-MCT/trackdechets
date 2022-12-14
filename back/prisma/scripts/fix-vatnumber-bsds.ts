import fs from "fs";
import path from "path";
import prompts from "prompts";
import { Updater, registerUpdater } from "./helper/helper";
import prisma from "../../src/prisma";
import { Form } from ".prisma/client";

@registerUpdater(
  "Clean BSD VAT numbers",
  "Clean BSD SIRET and VAT numbers",
  true
)
export class FixBSDVatUpdater implements Updater {
  async run() {
    try {
      const forms: Form[] = await prisma.$queryRawUnsafe(
        `select "id", "transporterCompanyVatNumber" from default$default."Form" as f where f."transporterCompanyVatNumber" ~ '(\\-|\\.|\\s)'`
      );

      try {
        const lines = forms.map(f =>
          [f.id, f.transporterCompanyVatNumber].join(", ")
        );
        fs.writeFileSync(
          path.join(
            __dirname,
            "..",
            "..",
            "log-clean-Form-transporterCompanyVatNumber.log"
          ),
          `${lines.join("\r\n")}`
        );
      } catch (err) {
        console.error(err);
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
        try {
          await prisma.form.update({
            data: {
              transporterCompanyVatNumber:
                formData.transporterCompanyVatNumber.replace(/[\W_]+/g, "")
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
              bsda.transporterCompanyVatNumber.replace(/[\W_]+/g, ""),
            transporterCompanySiret: bsda.transporterCompanySiret.replace(
              /[\W_]+/g,
              ""
            )
          },
          where: { id: "BSDA-20220323-TXK0A50KQ" }
        });
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
              transporterCompanySiret:
                bsvhuData.transporterCompanySiret.replace(/[\W_]+/g, "")
            },
            where: { id: bsvhuData.id }
          });
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
