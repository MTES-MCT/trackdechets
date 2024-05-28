import { logger } from "@td/logger";
import { prisma } from "@td/prisma";

const codesD9 = ["D9", "D 9"];
const commonSelectArgs = {
  destinationOperationCode: { in: codesD9 },
  destinationOperationMode: { not: null }
};

export class UpdateD9perationMode {
  // On met à jour le mode d'opération des  bsds dont le code d'opération est D9
  // Le code D9 étant non final,  il n'y a plus de mode d'opération correspondant

  async run() {
    // On gère tous les bsds et leur révisions sauf les bsffs et paohs qui n'acceptent pas le D9.
    // Les vhus ne devraient pas  accepter D9 mais la validation actuelle peut laisser passer
    // Les bsds concernés seront réindexés par la réindexation globale prévue dans la mep

    await this.processBsdasris();
    await this.processBsdas();
    await this.processBsdds();
    await this.processBsvhus();
    await this.processBsdaRevisionRequest();
    await this.processBsddRevisionRequest();

    logger.info(`Completed update`);
  }

  async processBsdasris() {
    logger.info(`Processing bsdasris`);

    const { count } = await prisma.bsdasri.updateMany({
      data: { destinationOperationMode: null },
      where: {
        ...commonSelectArgs
      }
    });

    logger.info(`${count} processed bsdasris`);
  }

  async processBsdas() {
    logger.info(`Processing bsdas`);

    const { count } = await prisma.bsda.updateMany({
      data: { destinationOperationMode: null },
      where: {
        ...commonSelectArgs
      }
    });

    logger.info(`${count} processed bsdas`);
  }
  async processBsvhus() {
    logger.info(`Processing vhus`);

    const { count } = await prisma.bsvhu.updateMany({
      data: { destinationOperationMode: null },
      where: {
        ...commonSelectArgs
      }
    });
    logger.info(`${count} processed vhus`);
  }

  async processBsdds() {
    logger.info(`Processing bsdd`);

    const { count } = await prisma.form.updateMany({
      data: { destinationOperationMode: null },
      where: {
        processingOperationDone: { in: codesD9 },
        destinationOperationMode: { not: null }
      }
    });
    logger.info(`${count} processed bsdds`);
  }

  async processBsdaRevisionRequest() {
    logger.info(`Processing bsda revisions`);

    const { count } = await prisma.bsdaRevisionRequest.updateMany({
      data: { destinationOperationMode: null },
      where: {
        ...commonSelectArgs
      }
    });
    logger.info(`${count} processed bsda revisions`);
  }
  async processBsddRevisionRequest() {
    logger.info(`Processing bsdds révisions`);

    const { count } = await prisma.bsddRevisionRequest.updateMany({
      data: { destinationOperationMode: null },
      where: {
        processingOperationDone: { in: codesD9 },
        destinationOperationMode: { not: null }
      }
    });

    logger.info(`${count} processed bsdd revisions`);
  }
}

export async function run() {
  await new UpdateD9perationMode().run();
}
