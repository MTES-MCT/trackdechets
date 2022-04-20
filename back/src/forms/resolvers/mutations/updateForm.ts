import { EmitterType, Form, Prisma, Status } from "@prisma/client";
import { isDangerous, WASTES_CODES } from "../../../common/constants";
import { checkIsAuthenticated } from "../../../common/permissions";
import {
  AppendixFormInput,
  MutationUpdateFormArgs,
  ResolversParentTypes
} from "../../../generated/graphql/types";
import { InvalidWasteCode, MissingTempStorageFlag } from "../../errors";
import { checkCanUpdate, checkIsFormContributor } from "../../permissions";
import { GraphQLContext } from "../../../types";
import { getFormOrFormNotFound } from "../../database";
import {
  expandFormFromDb,
  flattenFormInput,
  flattenTemporaryStorageDetailInput
} from "../../form-converter";
import { FormRepository, getFormRepository } from "../../repository";
import { FormSirets } from "../../types";
import {
  draftFormSchema,
  sealedFormSchema,
  validateAppendix2Forms
} from "../../validation";
import transitionForm from "../../workflow/transitionForm";
import { EventType } from "../../workflow/types";
import { UserInputError } from "apollo-server-core";

function validateArgs(args: MutationUpdateFormArgs) {
  const wasteDetailsCode = args.updateFormInput.wasteDetails?.code;
  if (wasteDetailsCode && !WASTES_CODES.includes(wasteDetailsCode)) {
    throw new InvalidWasteCode(wasteDetailsCode);
  }
  return args;
}

const updateFormResolver = async (
  parent: ResolversParentTypes["Mutation"],
  args: MutationUpdateFormArgs,
  context: GraphQLContext
) => {
  const user = checkIsAuthenticated(context);

  const { updateFormInput } = validateArgs(args);

  const { id, appendix2Forms, temporaryStorageDetail, ...formContent } =
    updateFormInput;

  if (
    formContent.wasteDetails?.code &&
    isDangerous(formContent.wasteDetails?.code) &&
    formContent.wasteDetails.isDangerous === undefined
  ) {
    formContent.wasteDetails.isDangerous = true;
  }

  const existingForm = await getFormOrFormNotFound({ id });
  const formRepository = getFormRepository(user);

  await checkCanUpdate(user, existingForm);

  const form = flattenFormInput(formContent);

  const existingAppendix2Forms = await formRepository.findAppendix2FormsById(
    id
  );
  const futureEmitterType = form.emitterType ?? existingForm.emitterType;
  const futureAppendix2Forms = appendix2Forms ?? existingAppendix2Forms;

  if (
    futureAppendix2Forms?.length &&
    futureEmitterType !== EmitterType.APPENDIX2
  ) {
    throw new UserInputError(
      "emitter.type doit être égal à APPENDIX2 lorsque appendix2Forms n'est pas vide"
    );
  }

  if (appendix2Forms) {
    await validateAppendix2Forms(appendix2Forms, { ...existingForm, ...form });
    // await handleFormsRemovedFromAppendix(
    //   existingForm,
    //   appendix2Forms,
    //   formRepository
    // );
  }

  // Construct form update payload
  const formUpdateInput: Prisma.FormUpdateInput = form;

  // Validate form input
  if (existingForm.status === "DRAFT") {
    await draftFormSchema.validate({ ...existingForm, ...formUpdateInput });
  } else {
    await sealedFormSchema.validate({ ...existingForm, ...formUpdateInput });
  }

  const isOrWillBeTempStorage =
    (existingForm.recipientIsTempStorage &&
      formContent.recipient?.isTempStorage !== false) ||
    formContent.recipient?.isTempStorage === true;

  const { temporaryStorageDetail: existingTemporaryStorageDetail } =
    await formRepository.findFullFormById(id);

  // make sure user will still be form contributor after update
  const nextFormSirets: FormSirets = {
    emitterCompanySiret:
      form.emitterCompanySiret ?? existingForm.emitterCompanySiret,
    recipientCompanySiret:
      form.recipientCompanySiret ?? existingForm.recipientCompanySiret,
    transporterCompanySiret:
      form.transporterCompanySiret ?? existingForm.transporterCompanySiret,
    traderCompanySiret:
      form.traderCompanySiret ?? existingForm.traderCompanySiret,
    brokerCompanySiret:
      form.brokerCompanySiret ?? existingForm.brokerCompanySiret,
    ecoOrganismeSiret: form.ecoOrganismeSiret ?? existingForm.ecoOrganismeSiret
  };

  if (temporaryStorageDetail || existingTemporaryStorageDetail) {
    nextFormSirets.temporaryStorageDetail = {
      destinationCompanySiret:
        temporaryStorageDetail?.destination?.company?.siret ??
        existingTemporaryStorageDetail?.destinationCompanySiret,
      transporterCompanySiret:
        existingTemporaryStorageDetail?.transporterCompanySiret
    };
  }

  await checkIsFormContributor(
    user,
    nextFormSirets,
    "Vous ne pouvez pas enlever votre établissement du bordereau"
  );

  if (
    existingTemporaryStorageDetail &&
    (!isOrWillBeTempStorage || temporaryStorageDetail === null)
  ) {
    formUpdateInput.temporaryStorageDetail = { disconnect: true };
  }

  if (temporaryStorageDetail) {
    if (!isOrWillBeTempStorage) {
      // The user is trying to add a temporary storage detail
      // but recipient is not set as temp storage on existing form
      // or input
      throw new MissingTempStorageFlag();
    }

    if (existingTemporaryStorageDetail) {
      formUpdateInput.temporaryStorageDetail = {
        update: flattenTemporaryStorageDetailInput(temporaryStorageDetail)
      };
    } else {
      formUpdateInput.temporaryStorageDetail = {
        create: flattenTemporaryStorageDetailInput(temporaryStorageDetail)
      };
    }
  }

  const updatedForm = await formRepository.update({ id }, formUpdateInput);

  if (appendix2Forms?.length) {
    const initialForms = await Promise.all(
      appendix2Forms.map(({ id }) => getFormOrFormNotFound({ id }))
    );
    await formRepository.setAppendix2({
      form: existingForm,
      initialForms: initialForms.map(f => ({
        form: f,
        quantity: f.quantityReceived
      }))
    });
  }

  //await handleFormsAddedToAppendix(updatedForm, user, formRepository);

  return expandFormFromDb(updatedForm);
};

export default updateFormResolver;

async function handleFormsRemovedFromAppendix(
  existingForm: Form,
  appendix2Forms: AppendixFormInput[],
  formRepository: FormRepository
) {
  if (existingForm.status !== Status.SEALED) {
    return;
  }

  // When the form is sealed & has an appendix 2
  // form no longer in the appendix must be set back to AWAITING_GROUP
  const previousAppendix2Forms = await formRepository.findAppendix2FormsById(
    existingForm.id
  );

  if (previousAppendix2Forms.length === 0) {
    return;
  }

  const nextAppendix2Ids = appendix2Forms.map(form => form.id);

  const appendix2ToUngroup = previousAppendix2Forms.filter(
    groupedAppendix => !nextAppendix2Ids.includes(groupedAppendix.id)
  );
  await formRepository.updateMany(
    appendix2ToUngroup.map(form => form.id),
    {
      status: Status.AWAITING_GROUP
    }
  );
}

async function handleFormsAddedToAppendix(
  updatedForm: Form,
  user: Express.User,
  formRepository: FormRepository
) {
  if (updatedForm.status !== Status.SEALED) {
    return;
  }

  // Mark potential additions to the appendix 2 as Grouped if the form is already sealed
  const appendix2Forms = await formRepository.findAppendix2FormsById(
    updatedForm.id
  );
  const promises = appendix2Forms
    .filter(form => form.status !== Status.GROUPED)
    .map(appendix => {
      return transitionForm(user, appendix, {
        type: EventType.MarkAsGrouped
      });
    });
  await Promise.all(promises);
}
