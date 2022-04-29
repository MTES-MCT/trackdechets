import { Form, Prisma } from "@prisma/client";
import { isDangerous, WASTES_CODES } from "../../../common/constants";
import { checkIsAuthenticated } from "../../../common/permissions";
import {
  MutationUpdateFormArgs,
  ResolversParentTypes
} from "../../../generated/graphql/types";
import { InvalidWasteCode, MissingTempStorageFlag } from "../../errors";
import { checkCanUpdate, checkIsFormContributor } from "../../permissions";
import { GraphQLContext } from "../../../types";
import { getFormOrFormNotFound } from "../../database";
import {
  expandFormFromDb,
  flattenFormInput,
  flattenTemporaryStorageDetailInput
} from "../../form-converter";
import { getFormRepository } from "../../repository";
import { FormSirets } from "../../types";
import { draftFormSchema, sealedFormSchema } from "../../validation";
import prisma from "../../../prisma";
import { UserInputError } from "apollo-server-core";

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
  return prisma.$transaction(async transaction => {
    const user = checkIsAuthenticated(context);

    const { updateFormInput } = validateArgs(args);

    const {
      id,
      appendix2Forms,
      grouping,
      temporaryStorageDetail,
      ...formContent
    } = updateFormInput;

    if (appendix2Forms && grouping) {
      throw new UserInputError(
        "Vous devez renseigné soit `appendix2Forms` soit `grouping` mais pas les deux"
      );
    }

    if (
      formContent.wasteDetails?.code &&
      isDangerous(formContent.wasteDetails?.code) &&
      formContent.wasteDetails.isDangerous === undefined
    ) {
      formContent.wasteDetails.isDangerous = true;
    }

    const existingForm = await getFormOrFormNotFound({ id });
    const formRepository = getFormRepository(user, transaction);

    await checkCanUpdate(user, existingForm);

    const form = flattenFormInput(formContent);

    // Construct form update payload
    const formUpdateInput: Prisma.FormUpdateInput = form;

    // Validate form input
    if (existingForm.status === "DRAFT") {
      await draftFormSchema.validate({ ...existingForm, ...formUpdateInput });
    } else {
      await sealedFormSchema.validate({ ...existingForm, ...formUpdateInput });
    }

    const isOrWillBeTempStorage =
      (existingForm.recipientIsTempStorage &&
        formContent.recipient?.isTempStorage !== false) ||
      formContent.recipient?.isTempStorage === true;

    const { temporaryStorageDetail: existingTemporaryStorageDetail } =
      await formRepository.findFullFormById(id);

    // make sure user will still be form contributor after update
    const nextFormSirets: FormSirets = {
      emitterCompanySiret:
        form.emitterCompanySiret ?? existingForm.emitterCompanySiret,
      recipientCompanySiret:
        form.recipientCompanySiret ?? existingForm.recipientCompanySiret,
      transporterCompanySiret:
        form.transporterCompanySiret ?? existingForm.transporterCompanySiret,
      traderCompanySiret:
        form.traderCompanySiret ?? existingForm.traderCompanySiret,
      brokerCompanySiret:
        form.brokerCompanySiret ?? existingForm.brokerCompanySiret,
      ecoOrganismeSiret:
        form.ecoOrganismeSiret ?? existingForm.ecoOrganismeSiret
    };

    if (temporaryStorageDetail || existingTemporaryStorageDetail) {
      nextFormSirets.temporaryStorageDetail = {
        destinationCompanySiret:
          temporaryStorageDetail?.destination?.company?.siret ??
          existingTemporaryStorageDetail?.destinationCompanySiret,
        transporterCompanySiret:
          existingTemporaryStorageDetail?.transporterCompanySiret
      };
    }

    await checkIsFormContributor(
      user,
      nextFormSirets,
      "Vous ne pouvez pas enlever votre établissement du bordereau"
    );

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

    const updatedForm = await formRepository.update({ id }, formUpdateInput);

    let appendix2: { quantity: number; form: Form }[] = null;

    if (grouping) {
      appendix2 = await Promise.all(
        grouping.map(async ({ form, quantity }) => ({
          form: await getFormOrFormNotFound(form),
          quantity
        }))
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
      form: updatedForm,
      appendix2
    });

    return expandFormFromDb(updatedForm);
  });
};

export default updateFormResolver;
