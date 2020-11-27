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
import { MissingTempStorageFlag, InvalidWasteCode } from "../../errors";
import { WASTES_CODES } from "../../../common/constants";
import { checkIsAuthenticated } from "../../../common/permissions";
import { checkCanReadUpdateDeleteForm } from "../../permissions";
import { GraphQLContext } from "../../../types";
import { getFormOrFormNotFound } from "../../database";
import { draftFormSchema } from "../../validation";
import { UserInputError } from "apollo-server-express";

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

  if (existingForm.status != "DRAFT") {
    const errMessage =
      "Seuls les bordereaux en brouillon peuvent être modifiés";
    throw new UserInputError(errMessage);
  }

  const form = flattenFormInput(formContent);

  // Construct form update payload
  const formUpdateInput: FormUpdateInput = {
    ...form,
    appendix2Forms: { set: appendix2Forms }
  };

  // Validate form input
  await draftFormSchema.validate(formUpdateInput);

  const isOrWillBeTempStorage =
    (existingForm.recipientIsTempStorage &&
      formContent.recipient?.isTempStorage !== false) ||
    formContent.recipient?.isTempStorage === true;

  const existingTemporaryStorageDetail = await prisma
    .form({ id })
    .temporaryStorageDetail();

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
