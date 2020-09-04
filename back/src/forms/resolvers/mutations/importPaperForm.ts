import {
  MutationResolvers,
  MutationImportPaperFormArgs,
  ImportPaperFormInput
} from "../../../generated/graphql/types";
import { getFormOrFormNotFound } from "../../database";
import {
  FormUpdateInput,
  FormCreateInput,
  prisma
} from "../../../generated/prisma-client";
import { flattenFormInput, expandFormFromDb } from "../../form-converter";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getReadableId } from "../../readable-id";
import { checkCanImportPaperForm } from "../../permissions";
import { UserInputError } from "apollo-server-express";

function validateFormInput(formInput: FormUpdateInput | FormCreateInput) {
  return formInput;
}

//function updateForm(id: string, input: ImportPaperFormInput) {}

const importPaperForm: MutationResolvers["importPaperForm"] = async (
  parent,
  { input },
  context
) => {
  const user = checkIsAuthenticated(context);

  const {
    id,
    receivedInfo,
    processedInfo,
    signingInfo,
    ecoOrganisme,
    ...baseformInput
  } = input;

  const formInput: FormUpdateInput | FormCreateInput = {
    ...flattenFormInput(baseformInput),
    ...receivedInfo,
    ...processedInfo,
    ...signingInfo,
    signedByTransporter: true,
    ecoOrganisme: {
      connect: { id: ecoOrganisme.id }
    }
  };

  if (id) {
    // the form was already created in TD, retrieves it
    const form = await getFormOrFormNotFound({ id });
    // check user is recipient of the form
    await checkCanImportPaperForm(user, form);
    const data = form;
    // merge current info with paper info, with priority given to paper data
    const formUpdateInput: FormUpdateInput = { ...data, ...formInput };
    // validate the updated form will be valid
    const validFormUpdateInput = validateFormInput(formUpdateInput);
    const updatedForm = await prisma.updateForm({
      where: { id },
      data: validFormUpdateInput
    });
    return expandFormFromDb(updatedForm);
  } else {
    // the form was never created in TD, create a new one

    if (!formInput.customId) {
      throw new UserInputError(
        "Vous devez préciser un champ customId qui permet d'identifier le BSD papier"
      );
    }

    const formCreateInput: FormCreateInput = {
      ...formInput,
      readableId: await getReadableId(),
      owner: { connect: { id: user.id } }
    };
    const createdForm = await prisma.createForm(formCreateInput);
    return expandFormFromDb(createdForm);
  }
};

export default importPaperForm;
