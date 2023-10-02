import { Updater, registerUpdater } from "./helper/helper";
import prisma from "../../src/prisma";
import { indexBsds, index } from "../../src/common/elastic";
import {
  BsdaForElasticInclude,
  toBsdElastic as bsdaToBsdElastic
} from "../../src/bsda/elastic";
import { toBsdElastic as bsdasriToBsdElastic } from "../../src/bsdasris/elastic";
import { toBsdElastic as bsffToBsdElastic } from "../../src/bsffs/elastic";

@registerUpdater(
  "Reindex transporter custom info and plates on BSDA, BSDASRI and BSFF",
  "Reindex transporter custom info and plates on BSDA, BSDASRI and BSFF",
  false
)
export class ReindexTransporterInfo implements Updater {
  async run() {
    const bsdas = await prisma.bsda.findMany({
      where: {
        OR: [
          { transporterCustomInfo: { not: null } },
          { transporterTransportPlates: { isEmpty: false } }
        ]
      },
      include: BsdaForElasticInclude
    });

    const bsdasris = await prisma.bsdasri.findMany({
      where: { transporterCustomInfo: { not: null } }
    });

    const bsffs = await prisma.bsff.findMany({
      where: { transporterCustomInfo: { not: null } },
      include: { packagings: true, ficheInterventions: true }
    });

    await indexBsds(
      index.alias,
      [
        ...bsdas.map(bsda => bsdaToBsdElastic(bsda)),
        ...bsdasris.map(bsdasri => bsdasriToBsdElastic(bsdasri)),
        ...bsffs.map(bsff => bsffToBsdElastic(bsff))
      ],
      index.elasticSearchUrl
    );
  }
}
