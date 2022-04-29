import { Form, Prisma } from "@prisma/client";
import { isDangerous } from "../../../common/constants";
import { checkIsAuthenticated } from "../../../common/permissions";
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
import { draftFormSchema } from "../../validation";
import { getFormOrFormNotFound } from "../../database";
import prisma from "../../../prisma";
import { UserInputError } from "apollo-server-core";
import Decimal from "decimal.js-light";

const createFormResolver = async (
  parent: ResolversParentTypes["Mutation"],
  { createFormInput }: MutationCreateFormArgs,
  context: GraphQLContext
) => {
  return prisma.$transaction(async transaction => {
    const user = checkIsAuthenticated(context);

    const { appendix2Forms, grouping, temporaryStorageDetail, ...formContent } =
      createFormInput;

    if (appendix2Forms && grouping) {
      throw new UserInputError(
        "Vous pouvez renseigner soit `appendix2Forms` soit `grouping` mais pas les deux"
      );
    }

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

    const formCreateInput: Prisma.FormCreateInput = {
      ...form,
      readableId: getReadableId(),
      owner: { connect: { id: user.id } }
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

    const formRepository = getFormRepository(user, transaction);
    const newForm = await formRepository.create(formCreateInput);

    let appendix2: { quantity: number; form: Form }[] = null;

    if (grouping) {
      appendix2 = await Promise.all(
        grouping.map(async ({ form, quantity }) => {
          const foundForm = await getFormOrFormNotFound(form);
          return {
            form: foundForm,
            quantity:
              quantity ??
              new Decimal(foundForm.quantityReceived)
                .minus(foundForm.quantityGrouped)
                .toNumber()
          };
        })
      );
    } else if (appendix2Forms) {
      appendix2 = await Promise.all(
        appendix2Forms.map(async ({ id }) => {
          const initialForm = await getFormOrFormNotFound({ id });
          return {
            form: initialForm,
            quantity: initialForm.quantityReceived
          };
        })
      );
    }

    await formRepository.setAppendix2({
      form: newForm,
      appendix2
    });

    eventEmitter.emit(TDEvent.CreateForm, {
      previousNode: null,
      node: newForm,
      updatedFields: {},
      mutation: "CREATED"
    });

    return expandFormFromDb(newForm);
  });
};

export default createFormResolver;
