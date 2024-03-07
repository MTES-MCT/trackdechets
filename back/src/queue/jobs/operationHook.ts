import { prisma } from "@td/prisma";
import { Job } from "bull";
import { operationHooksQueue } from "../producers/operationHook";
import { isFinalOperationCode } from "../../common/operationCodes";

// `operationHook` est appelé en récursif en "remontant" la traçabilité du bordereau final vers les
// bordereaux initiaux. Étant donné qu'on passe par la queue et qu'on ne peut pas sérialiser
// les données du bordereau final, on doit passer l'identifiant du bordereau final à
// chaque appel récursif.
export type OperationHookArgs = {
  // Identifiant du bordereau ayant reçu un traitement final
  finalFormId: string;
  // Identifiant d'un bordereau intermédiaire dont le déchet a subi une réexpédition, reconditionnement
  //  (entreposage provisoire) ou un regroupement (annexe 2) et dont le bordereau final
  // porte l'identifiant `finalFormId`
  initialFormId: string;
};

export async function operationHookJob(
  job: Job<OperationHookArgs>
): Promise<void> {
  await operationHook(job.data);
}

/*
 * Hook qui est appelé à chaque fois qu'un applique une opération
 * de traitement sur un bordereau
 */
export async function operationHook(args: OperationHookArgs) {
  const { finalFormId, initialFormId } = args;
  const finalForm = await prisma.form.findUniqueOrThrow({
    where: {
      id: finalFormId,
      isDeleted: false
    },
    select: {
      id: true,
      readableId: true,
      quantityReceived: true,
      processingOperationDone: true,
      recipientCompanySiret: true,
      recipientCompanyName: true,
      noTraceability: true
    }
  });
  // On récupère tous les bordereaux initiaux
  const formWithInitialForms = await prisma.form.findUniqueOrThrow({
    where: {
      id: initialFormId,
      isDeleted: false
    },
    include: {
      forwarding: true,
      grouping: { include: { initialForm: true } }
    }
  });

  const initialForms = [
    formWithInitialForms.forwarding,
    ...(formWithInitialForms.grouping ?? []).map(g => g.initialForm)
  ].filter(Boolean);

  // L'upsert FinalOperation n'est appelé qu'en cas de traitement final ou de rupture de traçabilité
  // Sinon on supprime les FinalOperations liés à finalForm et aux initialForms
  if (
    !isFinalOperationCode(finalForm.processingOperationDone!) ||
    finalForm.noTraceability === true
  ) {
    for (const initialForm of initialForms) {
      try {
        await prisma.finalOperation.delete({
          where: {
            formId_finalBsdReadableId: {
              formId: initialForm.id,
              finalBsdReadableId: finalForm.readableId
            }
          }
        });
      } catch (e) {
        // if does not exists, ignore and continue
        continue;
      }
    }
  } else {
    for (const initialForm of initialForms) {
      let quantityReceived = finalForm.quantityReceived;
      if (formWithInitialForms.emitterType === "APPENDIX2") {
        // affect only the fraction grouped of initialForm to quantity.
        const groupedInitialForm = formWithInitialForms.grouping.find(
          group => group.initialFormId === initialForm.id
        );
        if (groupedInitialForm) {
          quantityReceived = groupedInitialForm.quantity;
        }
      }

      if (
        quantityReceived === null ||
        finalForm.processingOperationDone === null
      ) {
        continue;
      }

      const data = {
        finalBsdReadableId: finalForm.readableId,
        quantity: quantityReceived,
        operationCode: finalForm.processingOperationDone,
        destinationCompanySiret: finalForm.recipientCompanySiret || "",
        destinationCompanyName: finalForm.recipientCompanyName || "",
        formId: initialForm.id
      };

      await prisma.finalOperation.upsert({
        where: {
          formId_finalBsdReadableId: {
            finalBsdReadableId: finalForm.readableId,
            formId: initialForm.id
          }
        },
        update: {
          quantity: {
            increment: data.quantity
          },
          operationCode: finalForm.processingOperationDone!,
          destinationCompanySiret: finalForm.recipientCompanySiret!,
          destinationCompanyName: finalForm.recipientCompanyName!
        },
        create: data
      });

      // Applique le hook de façon récursive sur les bordereaux initiaux
      await operationHooksQueue.add({
        finalFormId: finalForm.id,
        initialFormId: initialForm.id
      });
    }
  }
}
