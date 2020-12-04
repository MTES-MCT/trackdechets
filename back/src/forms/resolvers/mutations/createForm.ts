import {
  flattenFormInput,
  flattenTemporaryStorageDetailInput,
  expandFormFromDb
} from "../../form-converter";
import { getReadableId } from "../../readable-id";
import {
  FormCreateInput,
  Status,
  prisma
} from "../../../generated/prisma-client";
import {
  MutationCreateFormArgs,
  ResolversParentTypes
} from "../../../generated/graphql/types";
import { MissingTempStorageFlag, NotFormContributor } from "../../errors";
import { checkIsAuthenticated } from "../../../common/permissions";
import { GraphQLContext } from "../../../types";
import { draftFormSchema } from "../../validation";
import { isFormContributor } from "../../permissions";

const createFormResolver = async (
  parent: ResolversParentTypes["Mutation"],
  { createFormInput }: MutationCreateFormArgs,
  context: GraphQLContext
) => {
  const user = checkIsAuthenticated(context);

  const {
    appendix2Forms,
    temporaryStorageDetail,
    ...formContent
  } = createFormInput;

  const isContributor = await isFormContributor(user, {
    emitterCompanySiret: formContent.emitter?.company?.siret,
    recipientCompanySiret: formContent.recipient?.company?.siret,
    transporterCompanySiret: formContent.transporter?.company?.siret,
    traderCompanySiret: formContent.trader?.company?.siret,
    ecoOrganismeSiret: formContent.ecoOrganisme?.siret,
    ...(temporaryStorageDetail?.destination?.company?.siret
      ? {
          destinationCompanySiret:
            temporaryStorageDetail.destination.company.siret
        }
      : {})
  });

  if (!isContributor) {
    throw new NotFormContributor(
      "Vous ne pouvez pas créer un bordereau sur lequel votre entreprise n'apparait pas"
    );
  }

  const form = flattenFormInput(formContent);

  const formCreateInput: FormCreateInput = {
    ...form,
    readableId: await getReadableId(),
    owner: { connect: { id: user.id } },
    appendix2Forms: { connect: appendix2Forms }
  };

  await draftFormSchema.validate(formCreateInput);

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
