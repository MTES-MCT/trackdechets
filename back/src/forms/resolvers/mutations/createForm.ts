import { FormCreateInput, Status } from "@prisma/client";
import prisma from "src/prisma";
import { checkIsAuthenticated } from "../../../common/permissions";
import {
  MutationCreateFormArgs,
  ResolversParentTypes
} from "../../../generated/graphql/types";
import { eventEmitter, TDEvent } from "../../../events/emitter";
import { GraphQLContext } from "../../../types";
import { MissingTempStorageFlag } from "../../errors";
import {
  expandFormFromDb,
  flattenFormInput,
  flattenTemporaryStorageDetailInput
} from "../../form-converter";
import { getReadableId } from "../../readable-id";
import { draftFormSchema } from "../../validation";
import { checkIsFormContributor } from "../../permissions";
import { FormSirets } from "../../types";

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

  const formSirets: FormSirets = {
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
  };

  await checkIsFormContributor(
    user,
    formSirets,
    "Vous ne pouvez pas créer un bordereau sur lequel votre entreprise n'apparait pas"
  );

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

  const newForm = await prisma.form.create({ data: formCreateInput });

  eventEmitter.emit(TDEvent.CreateForm, {
    previousNode: null,
    node: newForm,
    updatedFields: {},
    mutation: "CREATED"
  });

  // create statuslog when and only when form is created
  await prisma.statusLog.create({
    data: {
      form: { connect: { id: newForm.id } },
      user: { connect: { id: context.user!.id } },
      status: newForm.status as Status,
      updatedFields: {},
      authType: user.auth,
      loggedAt: new Date()
    }
  });

  return expandFormFromDb(newForm);
};

export default createFormResolver;
