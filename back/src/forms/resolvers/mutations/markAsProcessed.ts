import { EmitterType, Prisma, Status } from "@prisma/client";

import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "@td/codegen-back";
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
  PROCESSING_OPERATIONS
} from "@td/constants";
import { operationHook } from "../../operationHook";
import { enqueueUpdateAppendix2Job } from "../../../queue/producers/updateAppendix2";

const markAsProcessedResolver: MutationResolvers["markAsProcessed"] = async (
  parent,
  args,
  context
) => {
  const user = checkIsAuthenticated(context);

  const { id, processedInfo } = args;

  const form = await getFormOrFormNotFound({ id }, { forwardedIn: true });

  await checkCanMarkAsProcessed(user, form);

  let formUpdateInput: Prisma.FormUpdateInput =
    flattenProcessedFormInput(processedInfo);

  await processedInfoSchema.validate(
    {
      // required for nextDestination validation
      wasteDetailsCode: form.wasteDetailsCode,
      wasteDetailsPop: form.wasteDetailsPop,
      wasteDetailsIsDangerous: form.wasteDetailsIsDangerous,
      ...formUpdateInput
    },
    { abortEarly: false }
  );

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
    const { updateAppendix1Forms, update } = getFormRepository(
      user,
      transaction
    );

    const processedForm = await update(
      { id: form.id, status: form.status },
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
      for (const formId of groupedForms.map(f => f.id)) {
        transaction.addAfterCommitCallback(async () => {
          // permet de faire passer le statut d'un bordereau annexé à "PROCESSED"
          // si tous les bordereaux dans lesquelle ils est regroupé sont au statut
          // "PROCESSED" et qu'il a été regroupé en totalité
          await enqueueUpdateAppendix2Job({
            formId,
            userId: user.id,
            auth: user.auth
          });
        });
      }
    }

    if (form.emitterType === EmitterType.APPENDIX1) {
      await updateAppendix1Forms({
        container: processedForm,
        grouped: groupedForms
      });
    }

    const finalForm = form.forwardedInId
      ? processedForm.forwardedIn!
      : processedForm;

    transaction.addAfterCommitCallback(async () => {
      await operationHook(finalForm, {
        runSync: false
      });
    });

    return processedForm;
  });

  return getAndExpandFormFromDb(processedForm.id);
};

export default markAsProcessedResolver;
