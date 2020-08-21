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
  NotFormContributor,
  FormNotFound
} from "../../errors";
import { WASTES_CODES } from "../../../common/constants";
import { checkIsAuthenticated } from "../../../common/permissions";
import { isFormContributor } from "../../permissions";
import { getFullUser } from "../../../users/database";
import { GraphQLContext } from "../../../types";
import { getFullForm, getFormOrFormNotFound } from "../../database";
import { validateEcorganisme } from "../../validators";

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
  const fullUser = await getFullUser(user);

  const { updateFormInput } = validateArgs(args);

  const {
    id,
    appendix2Forms,
    ecoOrganisme,
    temporaryStorageDetail,
    ...formContent
  } = updateFormInput;

  const existingForm = await getFormOrFormNotFound({ id });
  const fullExistingForm = await getFullForm(existingForm);

  if (!isFormContributor(fullUser, fullExistingForm)) {
    throw new NotFormContributor();
  }

  const form = flattenFormInput(formContent);

  // Construct form update payload
  const formUpdateInput: FormUpdateInput = {
    ...form,
    appendix2Forms: { set: appendix2Forms }
  };

  // Link to registered eco organisme by id
  if (ecoOrganisme) {
    const validEcoOrganisme = await validateEcorganisme(ecoOrganisme);
    formUpdateInput.ecoOrganisme = { connect: { id: validEcoOrganisme.id } };
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
};

export default updateFormResolver;
