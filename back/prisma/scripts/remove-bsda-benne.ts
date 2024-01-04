import { BsdaPackaging } from "../../src/generated/graphql/types";
import { prisma } from "@td/prisma";
import { registerUpdater, Updater } from "./helper/helper";

type SqlRowToUpdate = {
  id: string;
  packagings: BsdaPackaging[];
  p: BsdaPackaging;
};

@registerUpdater(
  "Update deprecated BODY_BENNE BSDAs",
  "As BODY_BENNE is deprecated, we edit bsdas with this packaging and change them to CONTENEUR_BAG (equivalent)",
  false
)
export class LoadAnonymousCompaniesUpdater implements Updater {
  async run() {
    try {
      console.info("✨ Starting script to edit BODY_BENNE packagings...");

      const rowsToUpdate = await prisma.$queryRaw<SqlRowToUpdate[]>`
      select bsda.id, bsda.packagings, p
        from default$default."Bsda" bsda
        cross join lateral json_array_elements ( packagings::json ) as p
        WHERE p->>'type' = 'BODY_BENNE'
      `;

      console.info(`🧮 There are ${rowsToUpdate.length} rows to update...`);

      for (const rowToUpdate of rowsToUpdate) {
        const newPackagings = rowToUpdate.packagings.filter(
          p => (p.type as any) !== "BODY_BENNE"
        );
        const bigBagPackaging = newPackagings.find(
          p => p.type === "CONTENEUR_BAG"
        );

        if (bigBagPackaging) {
          bigBagPackaging.quantity += rowToUpdate.p.quantity;
        } else {
          newPackagings.push({
            type: "CONTENEUR_BAG",
            quantity: rowToUpdate.p.quantity
          });
        }

        await prisma.bsda.update({
          where: { id: rowToUpdate.id },
          data: {
            packagings: newPackagings
          }
        });
      }
    } catch (err) {
      console.error("☠ Something went wrong during the update", err);
      throw new Error();
    }
  }
}
