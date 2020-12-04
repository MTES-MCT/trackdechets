import {
  flattenFormInput,
  flattenTemporaryStorageDetailInput,
  expandFormFromDb
} from "../../form-converter";
import { FormUpdateInput, prisma } from "../../../generated/prisma-client";
import {
  ResolversParentTypes,
  MutationUpdateFormArgs
} from "../../../generated/graphql/types";
import {
  MissingTempStorageFlag,
  InvalidWasteCode,
  NotFormContributor
} from "../../errors";
import { WASTES_CODES } from "../../../common/constants";
import { checkIsAuthenticated } from "../../../common/permissions";
import {
  checkCanReadUpdateDeleteForm,
  isFormContributor
} from "../../permissions";
import { GraphQLContext } from "../../../types";
import { getFormOrFormNotFound } from "../../database";
import { draftFormSchema, sealedFormSchema } from "../../validation";
import { UserInputError } from "apollo-server-express";
import { getUserCompanies } from "../../../users/database";
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

  await checkCanReadUpdateDeleteForm(user, existingForm);

  if (!["DRAFT", "SEALED"].includes(existingForm.status)) {
    const errMessage =
      "Seuls les bordereaux en brouillon ou en attente de collecte peuvent être modifiés";
    throw new UserInputError(errMessage);
  }

  const form = flattenFormInput(formContent);

  // Construct form update payload
  const formUpdateInput: FormUpdateInput = {
    ...form,
    appendix2Forms: { set: appendix2Forms }
  };

  // Validate form input
  if (existingForm.status === "DRAFT") {
    await draftFormSchema.validate(formUpdateInput);
  } else if (existingForm.status === "SEALED") {
    await sealedFormSchema.validate({ ...existingForm, ...formUpdateInput });
  }

  const isOrWillBeTempStorage =
    (existingForm.recipientIsTempStorage &&
      formContent.recipient?.isTempStorage !== false) ||
    formContent.recipient?.isTempStorage === true;

  const existingTemporaryStorageDetail = await prisma
    .form({ id })
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
        existingTemporaryStorageDetail?.destinationCompanySiret
    };
  }

  const willBeFormContributor = await isFormContributor(user, nextFormSirets);

  if (!willBeFormContributor) {
    throw new NotFormContributor(
      "Vous ne pouvez pas enlever votre établissement du bordereau"
    );
  }

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

  const updatedForm = await prisma.updateForm({
    where: { id },
    data: formUpdateInput
  });
  return expandFormFromDb(updatedForm);
};

export default updateFormResolver;
