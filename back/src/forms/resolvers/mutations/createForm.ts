import { Prisma, Status } from "@prisma/client";
import prisma from "../../../prisma";
import { checkIsAuthenticated } from "../../../common/permissions";
import getReadableId from "../../readableId";
import {
  AppendixFormInput,
  MutationCreateFormArgs,
  ResolversParentTypes
} from "../../../generated/graphql/types";
import { eventEmitter, TDEvent } from "../../../events/emitter";
import { GraphQLContext } from "../../../types";
import { FormAlreadyInAppendix2, MissingTempStorageFlag } from "../../errors";
import {
  expandFormFromDb,
  flattenFormInput,
  flattenTemporaryStorageDetailInput
} from "../../form-converter";
import { draftFormSchema } from "../../validation";
import { checkIsFormContributor } from "../../permissions";
import { FormSirets } from "../../types";
import { indexForm } from "../../elastic";
import { getFullForm } from "../../database";

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

  if (appendix2Forms) {
    const appendix2FormsIds = appendix2Forms.map(({ id }) => id).filter(Boolean);
    if (appendix2FormsIds.length !== appendix2Forms.length) {
      throw new Error("Pour les bordereaux en annexe, vous devez renseigner son ID.");
    }
    const appendix2FormsInDb = await prisma.form.findMany({
      where: { id: { in: appendix2FormsIds } }
    });

    if (appendix2FormsInDb.some(form => form.appendix2RootFormId != null)) {
      throw new FormAlreadyInAppendix2();
    }
  }

  const form = flattenFormInput(formContent);
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
  await indexForm(fullForm);

  return expandFormFromDb(newForm);
};

export default createFormResolver;
