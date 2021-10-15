import { Prisma, Status } from "@prisma/client";
import { checkIsAuthenticated } from "../../../common/permissions";
import { eventEmitter, TDEvent } from "../../../events/emitter";
import {
  MutationCreateFormArgs,
  ResolversParentTypes
} from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import { GraphQLContext } from "../../../types";
import { getFullForm } from "../../database";
import { indexForm } from "../../elastic";
import { MissingTempStorageFlag } from "../../errors";
import {
  expandFormFromDb,
  flattenFormInput,
  flattenTemporaryStorageDetailInput
} from "../../form-converter";
import { checkIsFormContributor } from "../../permissions";
import getReadableId from "../../readableId";
import { FormSirets } from "../../types";
import { validateAppendix2Forms, draftFormSchema } from "../../validation";

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
    brokerCompanySiret: formContent.broker?.company?.siret,
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

  if (appendix2Forms) {
    await validateAppendix2Forms(appendix2Forms, form);
  }

  const formCreateInput: Prisma.FormCreateInput = {
    ...form,
    readableId: getReadableId(),
    owner: { connect: { id: user.id } },
    appendix2Forms: appendix2Forms ? { connect: appendix2Forms } : undefined
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

  const fullForm = await getFullForm(newForm);
  await indexForm(fullForm, context);

  return expandFormFromDb(newForm);
};

export default createFormResolver;
