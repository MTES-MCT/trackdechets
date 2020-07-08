import {
  flattenFormInput,
  flattenTemporaryStorageDetailInput,
  expandFormFromDb
} from "../form-converter";
import { getReadableId } from "../readable-id";
import {
  FormUpdateInput,
  FormCreateInput,
  Status,
  prisma
} from "../../generated/prisma-client";
import { UserInputError } from "apollo-server-express";
import { MutationSaveFormArgs, Form } from "../../generated/graphql/types";

/**
 * Custom exception thrown when trying to set temporaryStorageDetail without
 * recipient.isTempStorage = true
 */
class BadTempStorageInput extends UserInputError {
  constructor() {
    super(
      "Vous ne pouvez pas préciser d'entreposage provisoire" +
        " sans spécifier recipient.isTempStorage = true"
    );
  }
}

export async function saveForm(
  userId: string,
  { formInput }: MutationSaveFormArgs
): Promise<Form> {
  const {
    id,
    appendix2Forms,
    ecoOrganisme,
    temporaryStorageDetail,
    ...formContent
  } = formInput;

  const form = flattenFormInput(formContent);

  if (id) {
    // The mutation is used to update an existing form

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
        throw new BadTempStorageInput();
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
  } else {
    // The mutation is used to create a brand new form
    const formCreateInput: FormCreateInput = {
      ...form,
      readableId: await getReadableId(),
      owner: { connect: { id: userId } },
      appendix2Forms: { connect: appendix2Forms }
    };

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
        throw new BadTempStorageInput();
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
      user: { connect: { id: userId } },
      status: newForm.status as Status,
      updatedFields: {},
      loggedAt: new Date()
    });

    return expandFormFromDb(newForm);
  }
}
