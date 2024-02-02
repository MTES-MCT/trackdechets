import { EmitterType, Form, Prisma, Status } from "@prisma/client";
import { prisma } from "@td/prisma";

import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import { getFormOrFormNotFound } from "../../database";
import {
  getAndExpandFormFromDb,
  flattenProcessedFormInput
} from "../../converter";
import { checkCanMarkAsProcessed } from "../../permissions";
import { processedInfoSchema } from "../../validation";
import transitionForm from "../../workflow/transitionForm";
import { EventType } from "../../workflow/types";
import { getFormRepository } from "../../repository";
import machine from "../../workflow/machine";
import { runInTransaction } from "../../../common/repository/helper";
import { checkVAT } from "jsvat";
import {
  cleanClue,
  countries,
  isSiret,
  isVat,
  PROCESSING_OPERATIONS,
  ProcessingOperationType
} from "@td/constants";

const markAsProcessedResolver: MutationResolvers["markAsProcessed"] = async (
  parent,
  args,
  context
) => {
  const user = checkIsAuthenticated(context);

  const { id, processedInfo } = args;

  const form = await getFormOrFormNotFound({ id });

  await checkCanMarkAsProcessed(user, form);

  let formUpdateInput: Prisma.FormUpdateInput =
    flattenProcessedFormInput(processedInfo);
  processedInfoSchema.validateSync(formUpdateInput, { abortEarly: false });

  // set default value for processingOperationDescription
  const operation = PROCESSING_OPERATIONS.find(
    otherOperation =>
      otherOperation.code === processedInfo.processingOperationDone
  );
  formUpdateInput.processingOperationDescription =
    processedInfo.processingOperationDescription || operation?.description;

  // auto-fill nextDestinationCompanyCountry
  if (
    isSiret(formUpdateInput.nextDestinationCompanySiret as string) &&
    !formUpdateInput.nextDestinationCompanyCountry
  ) {
    // only default to "FR" if there's an actual nextDestination
    // otherwise keep it empty to avoid filling a field for an object that doesn't exist
    formUpdateInput.nextDestinationCompanyCountry = "FR";
  }
  if (
    isVat(formUpdateInput.nextDestinationCompanyVatNumber as string) &&
    !formUpdateInput.nextDestinationCompanyCountry
  ) {
    const vatCountryCode = checkVAT(
      cleanClue(formUpdateInput.nextDestinationCompanyVatNumber as string),
      countries
    )?.country?.isoCode.short;
    formUpdateInput.nextDestinationCompanyCountry = vatCountryCode;
  }

  if (form.status === Status.TEMP_STORER_ACCEPTED) {
    // The form was flagged as temporary storage but the recipient decides to
    // fo a final treatement or a groupement
    formUpdateInput = {
      ...formUpdateInput,
      recipientIsTempStorage: false,
      forwardedIn: { delete: true }
    };
  } else if (!!form.forwardedInId) {
    // Processed info is applied on BSD suite
    formUpdateInput = {
      forwardedIn: {
        update: {
          status: machine.transition(Status.ACCEPTED, {
            type: EventType.MarkAsProcessed,
            formUpdateInput
          }).value as Status,
          ...formUpdateInput
        }
      }
    };
  }

  const groupedForms = await getFormRepository(user).findGroupedFormsById(
    form.id
  );

  const processedForm = await runInTransaction(async transaction => {
    const { updateAppendix1Forms, updateAppendix2Forms, update } =
      getFormRepository(user, transaction);

    const processedForm = await update(
      { id: form.id },
      {
        status: transitionForm(form, {
          type: EventType.MarkAsProcessed,
          formUpdateInput
        }),
        ...formUpdateInput
      }
    );

    // mark appendix2Forms as PROCESSED
    if (form.emitterType === EmitterType.APPENDIX2) {
      await updateAppendix2Forms(groupedForms);
    }

    if (form.emitterType === EmitterType.APPENDIX1) {
      await updateAppendix1Forms({
        container: processedForm,
        grouped: groupedForms
      });
    }

    return processedForm;
  });

  await operationHook(processedForm, processedForm.id);

  return getAndExpandFormFromDb(processedForm.id);
};

export default markAsProcessedResolver;

type OperationHookArgs = Pick<
  Form,
  | "readableId"
  | "quantityReceived"
  | "processingOperationDone"
  | "recipientCompanySiret"
  | "recipientCompanyName"
  | "noTraceability"
>;

// Hook qui est appelé à chaque fois qu'un applique une opération
// de traitement sur un bordereau
// À ajouter dans une queue plutôt que de faire ça en synchrone
export async function operationHook(
  // Informations sur le traitement final
  operation: OperationHookArgs,
  // Identifiant du bordereau
  formId: string
) {
  // Codes de traitement finaux
  const finalOperationCodes = PROCESSING_OPERATIONS.filter(
    p =>
    p.type === ProcessingOperationType.Eliminiation ||
    p.type === ProcessingOperationType.Valorisation
    ).map(p => p.code);
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
      // TODO gérer ça avec une queue
      // Potentiel point particulier : s'il y a eu scission puis regroupement
      // le hook pourrait être appelé plusieurs fois, il faudrait donc ajouter
      // un check sur l'unicité de finalBsdReadableId
      await operationHook(operation, initialForm.id);
    }
  }
}
