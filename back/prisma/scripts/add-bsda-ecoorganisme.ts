import { prisma } from "@td/prisma";
import { registerUpdater, Updater } from "./helper/helper";

@registerUpdater(
  "Add new eco-organismes for the BSDA",
  "Add new eco-organismes for the BSDA (and 1 for BSDD)",
  true
)
export class AddBsdaEcoOrganisme implements Updater {
  async run() {
    await prisma.ecoOrganisme.createMany({
      data: [
        {
          siret: "91187025100012",
          name: "ECOMINERO",
          address: "16 B BD JEAN JAURES 92110 CLICHY",
          handleBsda: false
        },
        {
          siret: "90272217200027",
          name: "VALOBAT",
          address: "77 ESP DU GENERAL DE GAULLE 92800 PUTEAUX",
          handleBsda: true
        }
      ],
      skipDuplicates: true
    });

    await prisma.ecoOrganisme.updateMany({
      where: { siret: { in: ["53740637300036", "53849587000031"] } },
      data: {
        handleBsda: true
      }
    });
  }
}
