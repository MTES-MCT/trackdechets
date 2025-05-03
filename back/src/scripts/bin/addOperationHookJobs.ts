import { prisma } from "@td/prisma";
import { TRIMMED_FINAL_OPERATION_CODES } from "../../common/operationCodes";
import { operationHook as bsddOperationHook } from "../../forms/operationHook";
import { operationHook as bsdaOperationHook } from "../../bsda/operationHook";
import { operationHook as bsffOperationHook } from "../../bsffs/operationHook";
import { operationHook as bsdasriOperationHook } from "../../bsdasris/operationHook";
import { FINAL_OPERATION_CODES } from "@td/constants";

(async () => {
  // On ne prend en compte que les bordereaux donc le traitement final au eu lieu
  // après le 1er janvier 2023
  const gt = new Date("2023-01-01");

  const finalOperationCodes = [
    ...FINAL_OPERATION_CODES,
    ...TRIMMED_FINAL_OPERATION_CODES
  ];

  // ~ 828 667
  const finalBsdds = await prisma.form.findMany({
    where: {
      processedAt: { gt },
      status: "PROCESSED",
      processingOperationDone: { in: finalOperationCodes }
    },
    select: {
      id: true,
      processedAt: true,
      processingOperationDone: true,
      noTraceability: true
    }
  });

  // ~218 227
  const finalBsdas = await prisma.bsda.findMany({
    where: {
      destinationOperationDate: { gt },
      status: "PROCESSED",
      destinationOperationCode: { in: finalOperationCodes }
    },
    select: {
      id: true,
      destinationOperationSignatureDate: true,
      destinationOperationCode: true
    }
  });

  // ~16 669
  const finalBsffPackagingss = await prisma.bsffPackaging.findMany({
    where: {
      operationDate: { gt },
      operationCode: { in: finalOperationCodes }
    },
    select: {
      id: true,
      operationSignatureDate: true,
      operationCode: true,
      operationNoTraceability: true
    }
  });

  // ~ 127 276
  const finalBsdasris = await prisma.bsdasri.findMany({
    where: {
      destinationOperationDate: { gt },
      status: "PROCESSED",
      destinationOperationCode: { in: finalOperationCodes }
    },
    select: {
      id: true,
      destinationOperationSignatureDate: true,
      destinationOperationCode: true
    }
  });

  for (const bsdd of finalBsdds) {
    await bsddOperationHook(bsdd, { runSync: false });
  }

  for (const bsda of finalBsdas) {
    await bsdaOperationHook(bsda, { runSync: false });
  }

  for (const bsffPackaging of finalBsffPackagingss) {
    await bsffOperationHook(bsffPackaging, { runSync: false });
  }

  for (const bsdasri of finalBsdasris) {
    await bsdasriOperationHook(bsdasri, { runSync: false });
  }
})().then(() => process.exit());
