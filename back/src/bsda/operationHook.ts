import { OperationHookJobArgs } from "../queue/jobs/operationHook";
import { BsdType, Bsda, Prisma } from "@prisma/client";
import { prisma } from "@td/prisma";
import { enqueueOperationHookJob } from "../queue/producers/operationHook";
import { isFinalOperationCode } from "../common/operationCodes";

export type OperationHookOpts = {
  // Permet de jouer la récursion des hooks en synchrone
  runSync: boolean;
};

// Fonction principale qui est appelée sur les BSDAs lorsqu'un
// traitement a lieu (ou lorsque le traitement est révisé)
export async function operationHook(
  bsda: Bsda,
  { runSync }: OperationHookOpts
) {
  if (
    bsda.destinationOperationSignatureDate &&
    bsda.destinationOperationCode &&
    isFinalOperationCode(bsda.destinationOperationCode)
  ) {
    const jobArgs: OperationHookJobArgs = {
      bsdType: BsdType.BSDA,
      initialBsdId: bsda.id,
      finalBsdId: bsda.id,
      operationCode: bsda.destinationOperationCode,
      noTraceability: false
    };

    if (runSync) {
      await operationHookFn(jobArgs, { runSync });
    } else {
      return enqueueOperationHookJob(jobArgs);
    }
  }
}

// Fonction récursive permettant de mettre à jour les informations de traitement
// sur toute la chaîne de traçabilité "amont" d'un BSDA ayant reçu un traitement final.
export async function operationHookFn(
  args: OperationHookJobArgs,
  { runSync }: OperationHookOpts
) {
  const {
    bsdType,
    initialBsdId,
    finalBsdId,
    operationCode,
    noTraceability,
    quantity: quantityArgs
  } = args;

  const initialBsda = await prisma.bsda.findUniqueOrThrow({
    where: { id: initialBsdId },
    include: {
      forwarding: { select: { id: true } },
      grouping: true
    }
  });

  const quantity = quantityArgs ?? initialBsda.destinationReceptionWeight!;

  const finalOperation: Prisma.BsdaFinalOperationCreateInput = {
    initialBsda: { connect: { id: initialBsdId } },
    finalBsda: { connect: { id: finalBsdId } },
    operationCode,
    quantity
  };

  await prisma.bsdaFinalOperation.create({
    data: finalOperation
  });

  if (initialBsda.forwarding) {
    // Applique le hook sur le bordereau avant rééexpédition
    const jobsArgs: OperationHookJobArgs = {
      bsdType,
      initialBsdId: initialBsda.forwarding.id,
      finalBsdId,
      operationCode,
      noTraceability: false,
      // fait remonter la pesée au niveau de l'exutoire
      quantity: initialBsda.destinationReceptionWeight!.toNumber()
    };
    if (runSync) {
      await operationHookFn(jobsArgs, { runSync });
    } else {
      await enqueueOperationHookJob(jobsArgs);
    }
  }

  if (initialBsda.grouping) {
    for (const groupedBsda of initialBsda.grouping) {
      const jobsArgs: OperationHookJobArgs = {
        bsdType,
        initialBsdId: groupedBsda.id,
        finalBsdId,
        operationCode,
        noTraceability
      };
      if (runSync) {
        await operationHookFn(jobsArgs, { runSync });
      } else {
        await enqueueOperationHookJob(jobsArgs);
      }
    }
  }
}
