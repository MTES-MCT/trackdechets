import {
  flattenFormInput,
  flattenTemporaryStorageDetailInput,
  expandFormFromDb
} from "../form-converter";
import { FormUpdateInput, prisma } from "../../generated/prisma-client";
import { UserInputError } from "apollo-server-express";
import {
  MutationUpdateFormArgs,
  Form,
  ResolversParentTypes
} from "../../generated/graphql/types";
import { GraphQLContext } from "../../types";

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
      throw new UserInputError(
        "Vous ne pouvez pas préciser d'entreposage provisoire sans spécifier recipient.isTempStorage = true"
      );
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
