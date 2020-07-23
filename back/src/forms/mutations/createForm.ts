import {
  flattenFormInput,
  flattenTemporaryStorageDetailInput,
  expandFormFromDb
} from "../form-converter";
import { getReadableId } from "../readable-id";
import { FormCreateInput, Status, prisma } from "../../generated/prisma-client";
import {
  MutationCreateFormArgs,
  Form,
  ResolversParentTypes
} from "../../generated/graphql/types";
import { GraphQLContext } from "../../types";
import { WASTES_CODES } from "../../common/constants";
import { InvalidWasteCode, MissingTempStorageFlag } from "../errors";

export async function createForm(
  _: ResolversParentTypes["Mutation"],
  {
    createFormInput: {
      appendix2Forms,
      ecoOrganisme,
      temporaryStorageDetail,
      ...formContent
    }
  }: MutationCreateFormArgs,
  context: GraphQLContext
): Promise<Form> {
  const form = flattenFormInput(formContent);
  const formCreateInput: FormCreateInput = {
    ...form,
    readableId: await getReadableId(),
    owner: { connect: { id: context.user!.id } },
    appendix2Forms: { connect: appendix2Forms }
  };

  if (
    formCreateInput.wasteDetailsCode &&
    !WASTES_CODES.includes(formCreateInput.wasteDetailsCode)
  ) {
    throw new InvalidWasteCode(formCreateInput.wasteDetailsCode);
  }

  if (ecoOrganisme) {
    // Connect with eco-organisme
    formCreateInput.ecoOrganisme = {
      connect: ecoOrganisme
    };
  }

  if (temporaryStorageDetail) {
    if (formContent.recipient?.isTempStorage !== true) {
      // The user is trying to set a temporary storage without
      // recipient.isTempStorage=true, throw error
      throw new MissingTempStorageFlag();
    }
    formCreateInput.temporaryStorageDetail = {
      create: flattenTemporaryStorageDetailInput(temporaryStorageDetail)
    };
  } else {
    if (formContent.recipient?.isTempStorage === true) {
      // Recipient is temp storage but no details provided
      // Create empty temporary storage details
      formCreateInput.temporaryStorageDetail = {
        create: {}
      };
    }
  }

  const newForm = await prisma.createForm(formCreateInput);

  // create statuslog when and only when form is created
  await prisma.createStatusLog({
    form: { connect: { id: newForm.id } },
    user: { connect: { id: context.user!.id } },
    status: newForm.status as Status,
    updatedFields: {},
    loggedAt: new Date()
  });

  return expandFormFromDb(newForm);
}
