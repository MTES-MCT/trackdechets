import { EmitterType, Prisma } from "@prisma/client";
import { UserInputError } from "apollo-server-core";
import { isDangerous } from "../../../common/constants";
import { checkIsAuthenticated } from "../../../common/permissions";
import { isCompanyMember } from "../../../companies/database";
import { eventEmitter, TDEvent } from "../../../events/emitter";
import {
  MutationCreateFormArgs,
  ResolversParentTypes
} from "../../../generated/graphql/types";
import { GraphQLContext } from "../../../types";
import { MissingTempStorageFlag } from "../../errors";
import {
  expandFormFromDb,
  flattenFormInput,
  flattenTemporaryStorageDetailInput
} from "../../form-converter";
import { checkIsFormContributor } from "../../permissions";
import getReadableId from "../../readableId";
import { getFormRepository } from "../../repository";
import { FormSirets } from "../../types";
import { draftFormSchema, validateAppendix2Forms } from "../../validation";
import prisma from "../../../prisma";

const createFormResolver = async (
  parent: ResolversParentTypes["Mutation"],
  { createFormInput }: MutationCreateFormArgs,
  context: GraphQLContext
) => {
  const user = checkIsAuthenticated(context);

  const { appendix2Forms, temporaryStorageDetail, ...formContent } =
    createFormInput;

  if (
    formContent.wasteDetails?.code &&
    isDangerous(formContent.wasteDetails?.code) &&
    formContent.wasteDetails.isDangerous === undefined
  ) {
    formContent.wasteDetails.isDangerous = true;
  }

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

  if (appendix2Forms?.length) {
    if (formContent.emitter?.type !== EmitterType.APPENDIX2) {
      throw new UserInputError(
        "emitter.type doit être égal à APPENDIX2 lorsque appendix2Forms n'est pas vide"
      );
    }
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

    // automatically computes the value of isFilledByEmitter based
    // on the authenticated user if it is not set explicitly
    let destinationIsFilledByEmitter =
      temporaryStorageDetail?.destination?.isFilledByEmitter ?? false;

    if (
      temporaryStorageDetail?.destination?.isFilledByEmitter === undefined &&
      formSirets.emitterCompanySiret?.length
    ) {
      const emitterCompany = await prisma.company.findFirst({
        where: { siret: formSirets.emitterCompanySiret }
      });
      destinationIsFilledByEmitter =
        temporaryStorageDetail.destination?.company?.siret?.length &&
        (await isCompanyMember(user, emitterCompany));
    }

    formCreateInput.temporaryStorageDetail = {
      create: {
        ...flattenTemporaryStorageDetailInput(temporaryStorageDetail),
        destinationIsFilledByEmitter
      }
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

  const formRepository = getFormRepository(user);
  const newForm = await formRepository.create(formCreateInput);

  eventEmitter.emit(TDEvent.CreateForm, {
    previousNode: null,
    node: newForm,
    updatedFields: {},
    mutation: "CREATED"
  });

  return expandFormFromDb(newForm);
};

export default createFormResolver;
