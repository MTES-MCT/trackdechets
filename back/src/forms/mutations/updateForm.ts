import {
  flattenFormInput,
  flattenTemporaryStorageDetailInput,
  expandFormFromDb
} from "../form-converter";
import { FormUpdateInput, prisma } from "../../generated/prisma-client";
import {
  MutationUpdateFormArgs,
  Form,
  ResolversParentTypes
} from "../../generated/graphql/types";
import { GraphQLContext } from "../../types";
import { MissingTempStorageFlag, InvalidWasteCode } from "../errors";
import { WASTES_CODES } from "../../common/constants";

export async function updateForm(
  _: ResolversParentTypes["Mutation"],
  {
    updateFormInput: {
      id,
      appendix2Forms,
      ecoOrganisme,
      temporaryStorageDetail,
      ...formContent
    }
  }: MutationUpdateFormArgs,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  context: GraphQLContext
): Promise<Form> {
  const form = flattenFormInput(formContent);

  if (form.wasteDetailsCode && !WASTES_CODES.includes(form.wasteDetailsCode)) {
    throw new InvalidWasteCode(form.wasteDetailsCode);
  }

  // form existence is already check in permissions
  const existingForm = await prisma.form({ id });

  // Construct form update payload
  const formUpdateInput: FormUpdateInput = {
    ...form,
    appendix2Forms: { set: appendix2Forms }
  };

  // Link to registered eco organisme by id
  if (ecoOrganisme) {
    formUpdateInput.ecoOrganisme = { connect: ecoOrganisme };
  }

  if (ecoOrganisme === null) {
    const existingEcoOrganisme = await prisma.forms({
      where: { id, ecoOrganisme: { id_not: null } }
    });
    if (existingEcoOrganisme && existingEcoOrganisme.length > 0) {
      // Disconnect linked eco organisme object
      formUpdateInput.ecoOrganisme = { disconnect: true };
    }
  }

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
}
