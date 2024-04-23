import { OperationHookJobArgs } from "../queue/jobs/operationHook";
import { BsdType, Bsdasri, Prisma } from "@prisma/client";
import { prisma } from "@td/prisma";
import { enqueueOperationHookJob } from "../queue/producers/operationHook";
import { isFinalOperationCode } from "../common/operationCodes";

export type OperationHookOpts = {
  // Permet de jouer la récursion des hooks en synchrone
  runSync: boolean;
};

// Fonction principale qui est appelée sur les BSDASRIs lorsqu'un
// traitement a lieu (ou lorsque le traitement est révisé)
export async function operationHook(
  bsdasri: Pick<
    Bsdasri,
    "id" | "destinationOperationSignatureDate" | "destinationOperationCode"
  >,
  { runSync }: OperationHookOpts
) {
  if (
    bsdasri.destinationOperationSignatureDate &&
    bsdasri.destinationOperationCode &&
    isFinalOperationCode(bsdasri.destinationOperationCode)
  ) {
    const jobArgs: OperationHookJobArgs = {
      bsdType: BsdType.BSDASRI,
      initialBsdId: bsdasri.id,
      finalBsdId: bsdasri.id,
      operationCode: bsdasri.destinationOperationCode,
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
// sur toute la chaîne de traçabilité "amont" d'un BSDASRI ayant reçu un traitement final.
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

  const initialBsdasri = await prisma.bsdasri.findUniqueOrThrow({
    where: { id: initialBsdId },
    include: {
      synthesizing: true,
      grouping: true
    }
  });

  const quantity =
    quantityArgs ?? initialBsdasri.destinationReceptionWasteWeightValue!;

  const finalOperation: Prisma.BsdasriFinalOperationCreateInput = {
    initialBsdasri: { connect: { id: initialBsdId } },
    finalBsdasri: { connect: { id: finalBsdId } },
    operationCode,
    quantity
  };

  await prisma.bsdasriFinalOperation.create({
    data: finalOperation
  });

  if (initialBsdasri.grouping) {
    for (const groupedBsda of initialBsdasri.grouping) {
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

  if (initialBsdasri.synthesizing) {
    for (const synthesizedBsda of initialBsdasri.synthesizing) {
      const jobsArgs: OperationHookJobArgs = {
        bsdType,
        initialBsdId: synthesizedBsda.id,
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
