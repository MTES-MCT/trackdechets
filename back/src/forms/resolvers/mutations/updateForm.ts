import {
  flattenFormInput,
  flattenTemporaryStorageDetailInput,
  expandFormFromDb
} from "../../form-converter";
import { Form, Prisma, Status } from "@prisma/client";
import prisma from "../../../prisma";
import {
  ResolversParentTypes,
  MutationUpdateFormArgs,
  AppendixFormInput
} from "../../../generated/graphql/types";
import { MissingTempStorageFlag, InvalidWasteCode } from "../../errors";
import { WASTES_CODES } from "../../../common/constants";
import { checkIsAuthenticated } from "../../../common/permissions";
import { checkCanUpdate, checkIsFormContributor } from "../../permissions";
import { GraphQLContext } from "../../../types";
import { getFormOrFormNotFound, getFullForm } from "../../database";
import {
  draftFormSchema,
  sealedFormSchema,
  validateAppendix2Forms
} from "../../validation";
import { FormSirets } from "../../types";
import { indexForm } from "../../elastic";
import { EventType } from "../../workflow/types";
import transitionForm from "../../workflow/transitionForm";

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

  const {
    id,
    appendix2Forms,
    temporaryStorageDetail,
    ...formContent
  } = updateFormInput;

  const existingForm = await getFormOrFormNotFound({ id });

  await checkCanUpdate(user, existingForm);

  const form = flattenFormInput(formContent);

  if (appendix2Forms) {
    await validateAppendix2Forms(appendix2Forms, { ...existingForm, ...form });
  }

  await handleFormsRemovedFromAppendix(existingForm, appendix2Forms);

  // Construct form update payload
  const formUpdateInput: Prisma.FormUpdateInput = {
    ...form,
    appendix2Forms: appendix2Forms ? { set: appendix2Forms } : undefined
  };

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

  const existingTemporaryStorageDetail = await prisma.form
    .findUnique({ where: { id } })
    .temporaryStorageDetail();

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

  const updatedForm = await prisma.form.update({
    where: { id },
    data: formUpdateInput
  });

  await handleFormsAddedToAppendix(updatedForm, user);

  // TODO: create statusLog?
  // We create a statusLog when creating a form
  // but not when it is updated between its creation and seal
  // so the form might have changed in-between without a proper statusLog

  const fullForm = await getFullForm(updatedForm);
  await indexForm(fullForm, context);

  return expandFormFromDb(updatedForm);
};

export default updateFormResolver;

async function handleFormsRemovedFromAppendix(
  existingForm: Form,
  appendix2Forms: AppendixFormInput[]
) {
  if (existingForm.status !== Status.SEALED) {
    return;
  }

  // When the form is sealed & has an appendix 2
  // form no longer in the appendix must be set back to AWAITING_GROUP
  const previousAppendix2Forms = await prisma.form
    .findUnique({ where: { id: existingForm.id } })
    .appendix2Forms();
  if (previousAppendix2Forms.length === 0) {
    return;
  }

  const nextAppendix2Ids = appendix2Forms.map(form => form.id);
  const appendix2ToUngroup = previousAppendix2Forms.filter(
    groupedAppendix => !nextAppendix2Ids.includes(groupedAppendix.id)
  );
  await prisma.form.updateMany({
    where: {
      id: { in: appendix2ToUngroup.map(form => form.id) }
    },
    data: {
      status: Status.AWAITING_GROUP
    }
  });
}

async function handleFormsAddedToAppendix(
  updatedForm: Form,
  user: Express.User
) {
  if (updatedForm.status !== Status.SEALED) {
    return;
  }

  // Mark potential additions to the appendix 2 as Grouped if the form is already sealed
  const appendix2Forms = await prisma.form
    .findUnique({ where: { id: updatedForm.id } })
    .appendix2Forms();
  const promises = appendix2Forms
    .filter(form => form.status !== Status.GROUPED)
    .map(appendix => {
      return transitionForm(user, appendix, {
        type: EventType.MarkAsGrouped
      });
    });
  await Promise.all(promises);
}
