import {
  flattenFormInput,
  flattenTemporaryStorageDetailInput,
  expandFormFromDb
} from "../../form-converter";
import { getReadableId } from "../../readable-id";
import {
  FormCreateInput,
  Status,
  prisma,
  EcoOrganisme
} from "../../../generated/prisma-client";
import {
  MutationCreateFormArgs,
  ResolversParentTypes
} from "../../../generated/graphql/types";
import { WASTES_CODES } from "../../../common/constants";
import {
  InvalidWasteCode,
  MissingTempStorageFlag,
  NotFormContributor
} from "../../errors";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getUserCompanies } from "../../../users/database";
import { validateEcorganisme } from "../../validation";
import { GraphQLContext } from "../../../types";

const createFormResolver = async (
  parent: ResolversParentTypes["Mutation"],
  { createFormInput }: MutationCreateFormArgs,
  context: GraphQLContext
) => {
  const user = checkIsAuthenticated(context);

  const {
    appendix2Forms,
    ecoOrganisme,
    temporaryStorageDetail,
    ...formContent
  } = createFormInput;

  let validEcoOrganisme: EcoOrganisme = null;

  if (ecoOrganisme) {
    validEcoOrganisme = await validateEcorganisme(ecoOrganisme);
  }
  const formInputSirets = [
    formContent.emitter?.company?.siret,
    formContent.recipient?.company?.siret,
    formContent.trader?.company?.siret,
    formContent.transporter?.company?.siret,
    ...(validEcoOrganisme ? [validEcoOrganisme.siret] : [])
  ];

  const userCompanies = await getUserCompanies(user.id);
  const userSirets = userCompanies.map(c => c.siret);
  if (!formInputSirets.some(siret => userSirets.includes(siret))) {
    throw new NotFormContributor();
  }

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
};

export default createFormResolver;
