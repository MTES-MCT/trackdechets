import prisma from "../../src/prisma";
import { registerUpdater, Updater } from "./helper/helper";

@registerUpdater(
  "Migrate fiche intervention's one-to-many relation to many-to-many",
  "Migrate fiche intervention's one-to-many relation to many-to-many",
  false
)
export class MigrateFicheInterventionBsffRelation implements Updater {
  async run() {
    const ficheInterventions = await prisma.bsffFicheIntervention.findMany({
      where: {
        bsffId: {
          not: null
        }
      }
    });

    for (const ficheIntervention of ficheInterventions) {
      await prisma.bsffFicheIntervention.update({
        data: {
          bsffs: {
            connect: {
              id: ficheIntervention.bsffId
            }
          },
          bsffId: null
        },
        where: {
          id: ficheIntervention.id
        }
      });
    }
  }
}
