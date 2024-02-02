import { Form } from "@prisma/client";
import { PROCESSING_OPERATIONS, ProcessingOperationType } from "@td/constants";
import { prisma } from "@td/prisma";
import { Job } from "bull";
import { operationHooksQueue } from "../producers/bsdUpdate";

export type OperationHookArgs = {
  // Informations sur le traitement final
  operation: Pick<
    Form,
    | "readableId"
    | "quantityReceived"
    | "processingOperationDone"
    | "recipientCompanySiret"
    | "recipientCompanyName"
    | "noTraceability"
  >;
  formId: string;
};

export const OPERATION_HOOKS_JOB_NAME = "";

export async function operationHookJob(
  job: Job<OperationHookArgs>
): Promise<void> {
  await operationHook(job.data);
}

// Codes de traitement finaux
const finalOperationCodes = PROCESSING_OPERATIONS.filter(
  p =>
    p.type === ProcessingOperationType.Eliminiation ||
    p.type === ProcessingOperationType.Valorisation
).map(p => p.code);

/*
 * Hook qui est appelé à chaque fois qu'un applique une opération
 * de traitement sur un bordereau
 */
export async function operationHook(args: OperationHookArgs) {
  const { operation, formId } = args;
  if (
    // Le code n'est appelé qu'en cas de traitement final ou de rupture de traçabilité
    finalOperationCodes.includes(operation.processingOperationDone!) ||
    operation.noTraceability
  ) {
    // On va chercher tous les bordereaux initiaux
    const formWithInitialForms = await prisma.form.findUniqueOrThrow({
      where: { id: formId, isDeleted: false },
      include: {
        forwarding: true,
        grouping: { include: { initialForm: true } }
      }
    });

    const initialForms = [
      formWithInitialForms.forwarding,
      ...(formWithInitialForms.grouping ?? []).map(g => g.initialForm)
    ].filter(Boolean);

    for (const initialForm of initialForms) {
      await prisma.form.update({
        where: { id: initialForm.id },
        data: {
          finalOperations: {
            create: {
              finalBsdReadableId: operation.readableId,
              quantity: operation.quantityReceived!,
              operationCode: operation.processingOperationDone!,
              destinationCompanySiret: operation.recipientCompanySiret!,
              destinationCompanyName: operation.recipientCompanyName!
            }
          }
        }
      });

      // Applique le hook de façon récursive sur les bordereaux initiaux
      // Attention : s'il y a eu scission puis regroupement
      // le hook pourrait être appelé plusieurs fois, il faudrait donc vérifier
      // l'unicité de finalBsdReadableId
      await operationHooksQueue.add({
        operation,
        formId: initialForm.id
      });
    }
  }
}
