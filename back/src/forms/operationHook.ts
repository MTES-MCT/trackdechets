import { OperationHookJobArgs } from "../queue/jobs/operationHook";
import { BsdType, Form, Prisma } from "@td/prisma";
import { prisma } from "@td/prisma";
import Decimal from "decimal.js";
import { enqueueOperationHookJob } from "../queue/producers/operationHook";
import { isFinalOperationCode } from "../common/operationCodes";

export type OperationHookOpts = {
  // Permet de jouer la récursion des hooks en synchrone
  runSync: boolean;
};

// Fonction principale qui est appelée sur les BSDDs lorsqu'un
// traitement a lieu (ou lorsque le traitement est révisé)
export async function operationHook(
  form: Pick<
    Form,
    "id" | "processedAt" | "processingOperationDone" | "noTraceability"
  >,
  { runSync }: OperationHookOpts
) {
  if (
    form.processedAt &&
    form.processingOperationDone &&
    (isFinalOperationCode(form.processingOperationDone) || form.noTraceability)
  ) {
    const jobArgs: OperationHookJobArgs = {
      bsdType: BsdType.BSDD,
      initialBsdId: form.id,
      finalBsdId: form.id,
      operationCode: form.processingOperationDone,
      noTraceability: form.noTraceability ?? false
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
    quantity: quantityArgs,
    fraction = 1
  } = args;

  const initialForm = await prisma.form.findUniqueOrThrow({
    where: { id: initialBsdId },
    include: {
      forwarding: { select: { id: true } },
      grouping: {
        include: { initialForm: { select: { id: true, forwardedInId: true } } }
      }
    }
  });

  const quantity = new Decimal(fraction).times(
    quantityArgs ?? initialForm.quantityReceived!
  );

  const finalOperation: Prisma.BsddFinalOperationCreateInput = {
    initialForm: { connect: { id: initialBsdId } },
    finalForm: { connect: { id: finalBsdId } },
    operationCode,
    noTraceability,
    quantity
  };

  // Met à jour les informations de traitement final
  await prisma.bsddFinalOperation.upsert({
    where: {
      initialFormId_finalFormId: {
        initialFormId: initialBsdId,
        finalFormId: finalBsdId
      }
    },
    update: {
      // Ce cas est peu probable d'un point de vue métier mais on le gère
      // quand même. Il peut se présenter si :
      // - un BSDD est regroupé dans plusieurs BSDD de groupement
      // avec ventilation des quantités.
      // - les bordereaux de groupement sont ensuite groupés dans
      // un même BSDD de groupement qui va subir un traitement final.
      // Ça nous donne donc une traçabilité en forme de "losange" et
      // operationHook va être appelé plusieurs fois sur le BSDD initial
      // avec la même opération finale. On additionne donc à chaque fois
      // les quantités ventilées initialement.
      quantity: { increment: quantity! }
    },
    create: finalOperation
  });

  if (initialForm.forwarding) {
    // Applique le hook sur le bordereau avant entreposage provisoire
    const jobsArgs: OperationHookJobArgs = {
      bsdType,
      initialBsdId: initialForm.forwarding.id,
      finalBsdId: finalBsdId,
      operationCode,
      noTraceability,
      quantity: initialForm.quantityReceived!.toNumber(),
      fraction: quantity.dividedBy(initialForm.quantityReceived!).toNumber()
    };
    if (runSync) {
      await operationHookFn(jobsArgs, { runSync });
    } else {
      await enqueueOperationHookJob(jobsArgs);
    }
  }

  if (initialForm.grouping) {
    for (const groupement of initialForm.grouping) {
      const jobsArgs: OperationHookJobArgs = {
        bsdType,
        initialBsdId:
          // Petite subtilité ici : si le BSDD regroupé est un BSDD avec
          // entreposage provisoire, alors on applique d'abord le hook sur le
          // BSDD suite.
          groupement.initialForm.forwardedInId ?? groupement.initialFormId,
        finalBsdId: finalBsdId,
        operationCode,
        noTraceability,
        quantity: groupement.quantity,
        fraction: quantity.dividedBy(initialForm.quantityReceived!).toNumber()
      };
      if (runSync) {
        await operationHookFn(jobsArgs, { runSync });
      } else {
        await enqueueOperationHookJob(jobsArgs);
      }
    }
  }
}
