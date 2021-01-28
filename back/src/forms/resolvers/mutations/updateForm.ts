import {
  flattenFormInput,
  flattenTemporaryStorageDetailInput,
  expandFormFromDb
} from "../../form-converter";
import { Prisma } from "@prisma/client";
import prisma from "../../../prisma";
import {
  ResolversParentTypes,
  MutationUpdateFormArgs
} from "../../../generated/graphql/types";
import { MissingTempStorageFlag, InvalidWasteCode } from "../../errors";
import { WASTES_CODES } from "../../../common/constants";
import { checkIsAuthenticated } from "../../../common/permissions";
import { checkCanUpdate, checkIsFormContributor } from "../../permissions";
import { GraphQLContext } from "../../../types";
import { getFormOrFormNotFound } from "../../database";
import { draftFormSchema, sealedFormSchema } from "../../validation";
import { FormSirets } from "../../types";

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

  // Construct form update payload
  const formUpdateInput: Prisma.FormUpdateInput = {
    ...form,
    appendix2Forms: { set: appendix2Forms }
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
  return expandFormFromDb(updatedForm);
};

export default updateFormResolver;
