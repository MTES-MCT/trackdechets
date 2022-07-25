import { Form, Prisma } from "@prisma/client";
import { isDangerous, WASTES_CODES } from "../../../common/constants";
import { checkIsAuthenticated } from "../../../common/permissions";
import {
  MutationUpdateFormArgs,
  ResolversParentTypes
} from "../../../generated/graphql/types";
import { InvalidWasteCode, MissingTempStorageFlag } from "../../errors";
import {
  checkCanUpdate,
  checkIsFormContributor,
  formToCompanies
} from "../../permissions";
import { GraphQLContext } from "../../../types";
import { getFormOrFormNotFound } from "../../database";
import {
  expandFormFromDb,
  flattenFormInput,
  flattenTemporaryStorageDetailInput
} from "../../form-converter";
import { getFormRepository } from "../../repository";
import { FormCompanies } from "../../types";
import {
  validateForwardedInCompanies,
  draftFormSchema,
  sealedFormSchema,
  validateIntermediariesInput
} from "../../validation";
import prisma from "../../../prisma";
import { UserInputError } from "apollo-server-core";
import { Decimal } from "decimal.js-light";

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

  const { updateFormInput } = validateArgs(args);

  const {
    id,
    appendix2Forms,
    grouping,
    temporaryStorageDetail,
    intermediaries,
    ...formContent
  } = updateFormInput;

  if (appendix2Forms && grouping) {
    throw new UserInputError(
      "Vous devez renseigner soit `appendix2Forms` soit `grouping` mais pas les deux"
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

  const forwardedIn = await prisma.form
    .findUnique({
      where: { id: existingForm.id }
    })
    .forwardedIn();

  const formCompanies = await formToCompanies(existingForm);
  const nextFormCompanies: FormCompanies = {
    emitterCompanySiret:
      form.emitterCompanySiret ?? formCompanies.emitterCompanySiret,
    recipientCompanySiret:
      form.recipientCompanySiret ?? formCompanies.recipientCompanySiret,
    transporterCompanySiret:
      form.transporterCompanySiret ?? formCompanies.transporterCompanySiret,
    traderCompanySiret:
      form.traderCompanySiret ?? formCompanies.traderCompanySiret,
    brokerCompanySiret:
      form.brokerCompanySiret ?? formCompanies.brokerCompanySiret,
    ecoOrganismeSiret:
      form.ecoOrganismeSiret ?? formCompanies.ecoOrganismeSiret,
    ...(intermediaries?.length
      ? {
          intermediariesVatNumbers: intermediaries?.map(
            intermediary => intermediary.vatNumber ?? null
          ),
          intermediariesSirets: intermediaries?.map(
            intermediary => intermediary.siret ?? null
          )
        }
      : {
          intermediariesVatNumbers: formCompanies.intermediariesVatNumbers,
          intermediariesSirets: formCompanies.intermediariesSirets
        })
  };

  if (temporaryStorageDetail || forwardedIn) {
    nextFormCompanies.forwardedIn = {
      recipientCompanySiret:
        temporaryStorageDetail?.destination?.company?.siret ??
        forwardedIn?.recipientCompanySiret,
      transporterCompanySiret: forwardedIn?.transporterCompanySiret
    };
  }

  await checkIsFormContributor(
    user,
    nextFormCompanies,
    "Vous ne pouvez pas enlever votre établissement du bordereau"
  );

  await validateForwardedInCompanies(form as Form);

  // Delete temporaryStorageDetail
  if (
    forwardedIn &&
    (!isOrWillBeTempStorage || temporaryStorageDetail === null)
  ) {
    formUpdateInput.forwardedIn = { delete: true };
  }

  if (temporaryStorageDetail) {
    if (!isOrWillBeTempStorage) {
      // The user is trying to add a temporary storage detail
      // but recipient is not set as temp storage on existing form
      // or input
      throw new MissingTempStorageFlag();
    }

    if (forwardedIn) {
      formUpdateInput.forwardedIn = {
        update: flattenTemporaryStorageDetailInput(temporaryStorageDetail)
      };
    } else {
      formUpdateInput.forwardedIn = {
        create: {
          owner: { connect: { id: user.id } },
          readableId: `${existingForm.readableId}-suite`,
          ...flattenTemporaryStorageDetailInput(temporaryStorageDetail)
        }
      };
    }
  }

  // Delete intermediaries
  if (
    (!!intermediaries && intermediaries?.length === 0) ||
    intermediaries === null
  ) {
    formUpdateInput.intermediaries = {
      deleteMany: {}
    };
  } else if (intermediaries?.length) {
    // Update the intermediaties
    const existingIntermediaries =
      await prisma.intermediaryFormAssociation.findMany({
        where: { formId: existingForm.id }
      });
    // combine existing info with update info
    const intermediariesInput = intermediaries.map(companyInput => {
      const match = existingIntermediaries.find(
        ({ siret, vatNumber }) =>
          siret === companyInput.siret || vatNumber === companyInput.vatNumber
      );
      return {
        ...(match
          ? {
              ...match,
              siret: companyInput.siret ?? "",
              name: match.name ?? ""
            }
          : {}),
        ...{
          ...companyInput,
          siret: companyInput.siret ?? "",
          name: companyInput.name ?? ""
        }
      };
    });

    formUpdateInput.intermediaries = {
      deleteMany: {},
      createMany: {
        data: await validateIntermediariesInput(intermediariesInput),
        skipDuplicates: true
      }
    };
  }

  let appendix2: { quantity: number; form: Form }[] = null;

  const { findAppendix2FormsById } = getFormRepository(user);
  const existingAppendix2Forms = await findAppendix2FormsById(existingForm.id);

  if (existingAppendix2Forms?.length) {
    const updatedSiret = formUpdateInput?.emitterCompanySiret;
    if (!!updatedSiret && updatedSiret !== existingForm?.emitterCompanySiret) {
      throw new UserInputError(
        "Des bordereaux figurent dans l'annexe 2, le siret de l'émetteur ne peut pas être modifié."
      );
    }
  }
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

  const updatedForm = await prisma.$transaction(async transaction => {
    const { update, setAppendix2 } = getFormRepository(user, transaction);
    const updatedForm = await update({ id }, formUpdateInput);
    await setAppendix2({
      form: updatedForm,
      appendix2
    });
    return updatedForm;
  });

  return expandFormFromDb(updatedForm);
};

export default updateFormResolver;
