import { OperationHookJobArgs } from "../queue/jobs/operationHook";
import { BsdType, BsffPackaging, BsffType, Prisma } from "@prisma/client";
import { prisma } from "@td/prisma";
import { enqueueOperationHookJob } from "../queue/producers/operationHook";
import { isFinalOperationCode } from "../common/operationCodes";

export type OperationHookOpts = {
  // Permet de jouer la récursion des hooks en synchrone
  runSync: boolean;
};

// Fonction principale qui est appelée sur un packaging BSFF lorsqu'un
// traitement a lieu
export async function operationHook(
  bsffPackaging: BsffPackaging,
  { runSync }: OperationHookOpts
) {
  if (
    bsffPackaging.operationSignatureDate &&
    bsffPackaging.operationCode &&
    (isFinalOperationCode(bsffPackaging.operationCode) ||
      bsffPackaging.operationNoTraceability)
  ) {
    const jobArgs: OperationHookJobArgs = {
      bsdType: BsdType.BSFF,
      // cas spécial sur le BSFF, l'opération s'applique sur les
      // contenants et non pas du le bordereau
      initialBsdId: bsffPackaging.id,
      finalBsdId: bsffPackaging.id,
      operationCode: bsffPackaging.operationCode,
      noTraceability: bsffPackaging.operationNoTraceability ?? false
    };

    if (runSync) {
      await operationHookFn(jobArgs, { runSync });
    } else {
      return enqueueOperationHookJob(jobArgs);
    }
  }
}

// Fonction récursive permettant de mettre à jour les informations de traitement
// sur toute la chaîne de traçabilité "amont" d'un BSDD ayant reçu un traitement final.
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

  const initialBsffPackaging = await prisma.bsffPackaging.findUniqueOrThrow({
    where: { id: initialBsdId },
    include: {
      previousPackagings: true,
      bsff: true
    }
  });

  const quantity = quantityArgs ?? initialBsffPackaging.acceptationWeight!;

  const finalOperation: Prisma.BsffPackagingFinalOperationCreateInput = {
    initialBsffPackaging: { connect: { id: initialBsdId } },
    finalBsffPackaging: { connect: { id: finalBsdId } },
    operationCode,
    noTraceability,
    quantity
  };

  await prisma.bsffPackagingFinalOperation.create({
    data: finalOperation
  });

  if (
    initialBsffPackaging.previousPackagings &&
    initialBsffPackaging.previousPackagings.length > 0
  ) {
    for (const previousPackaging of initialBsffPackaging.previousPackagings) {
      const jobsArgs: OperationHookJobArgs = {
        bsdType,
        initialBsdId: previousPackaging.id,
        finalBsdId: finalBsdId,
        operationCode,
        noTraceability,
        quantity:
          initialBsffPackaging.bsff.type === BsffType.RECONDITIONNEMENT
            ? previousPackaging.acceptationWeight!
            : // Prend l'info de poids la plus à jour s'il n'y a pas eu de reconditionnement
              initialBsffPackaging.acceptationWeight!
      };
      if (runSync) {
        await operationHookFn(jobsArgs, { runSync });
      } else {
        await enqueueOperationHookJob(jobsArgs);
      }
    }
  }
}
