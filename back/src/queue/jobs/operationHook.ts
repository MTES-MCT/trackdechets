import { prisma } from "@td/prisma";
import { Job } from "bull";
import { operationHooksQueue } from "../producers/operationHook";
import { isFinalOperationCode } from "../../common/operationCodes";

export type OperationHookArgs = {
  // Informations sur le traitement final
  operationId: string;
  formId: string;
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
  const { operationId, formId } = args;
  const operation = await prisma.form.findUniqueOrThrow({
    where: {
      id: operationId,
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
      id: formId,
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

  if (
    // Le code n'est appelé qu'en cas de traitement final ou de rupture de traçabilité
    isFinalOperationCode(operation.processingOperationDone!) ||
    operation.noTraceability
  ) {
    for (const initialForm of initialForms) {
      let quantityReceived = operation.quantityReceived;
      if (formWithInitialForms.emitterType === "APPENDIX2") {
        // affect only the fraction grouped of initialForm to quantity.
        const groupedInitialForm = formWithInitialForms.grouping.find(
          group => group.initialFormId === initialForm.id
        );
        if (groupedInitialForm) {
          quantityReceived = groupedInitialForm.quantity;
        }
      }

      const data = {
        finalBsdReadableId: operation.readableId,
        quantity: quantityReceived!,
        operationCode: operation.processingOperationDone!,
        destinationCompanySiret: operation.recipientCompanySiret!,
        destinationCompanyName: operation.recipientCompanyName!
      };

      if (Object.values(data).some(value => value === null)) {
        continue;
      }

      const countFinaloperations = await prisma.finalOperation.count({
        where: {
          formId: initialForm.id,
          finalBsdReadableId: operation.readableId
        }
      });

      if (countFinaloperations) {
        await prisma.form.update({
          where: { id: initialForm.id },
          data: {
            finalOperations: {
              // s'il y a eu scission puis regroupement
              // le hook pourrait être appelé plusieurs fois,
              // il faut donc respecter l'unicité de finalBsdReadableId
              update: {
                where: {
                  formId_finalBsdReadableId: {
                    finalBsdReadableId: operation.readableId,
                    formId: initialForm.id
                  }
                },
                data
              }
            }
          }
        });
      } else {
        await prisma.form.update({
          where: { id: initialForm.id },
          data: {
            finalOperations: {
              // s'il y a eu scission puis regroupement
              // le hook pourrait être appelé plusieurs fois,
              // il faut donc respecter l'unicité de finalBsdReadableId
              create: data
            }
          }
        });
      }

      // Applique le hook de façon récursive sur les bordereaux initiaux
      await operationHooksQueue.add({
        operationId: operation.id,
        formId: initialForm.id
      });
    }
  } else {
    for (const initialForm of initialForms) {
      await prisma.form.update({
        where: { id: initialForm.id },
        data: {
          finalOperations: { deleteMany: {} }
        }
      });
    }
  }
}
