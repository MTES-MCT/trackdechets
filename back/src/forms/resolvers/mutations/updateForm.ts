import { Prisma } from "@prisma/client";
import { isDangerous, BSDD_WASTE_CODES } from "../../../common/constants";
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
} from "../../converter";
import { getFormRepository } from "../../repository";
import { FormCompanies } from "../../types";
import {
  draftFormSchema,
  sealedFormSchema,
  validateGroupement,
  validateIntermediariesInput
} from "../../validation";
import prisma from "../../../prisma";
import { UserInputError } from "apollo-server-core";
import { appendix2toFormFractions } from "../../compat";
import { runInTransaction } from "../../../common/repository/helper";

function validateArgs(args: MutationUpdateFormArgs) {
  const wasteDetailsCode = args.updateFormInput.wasteDetails?.code;
  if (wasteDetailsCode && !BSDD_WASTE_CODES.includes(wasteDetailsCode)) {
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
  const futureForm = { ...existingForm, ...form };

  // Construct form update payload
  const formUpdateInput: Prisma.FormUpdateInput = form;

  // Validate form input
  if (existingForm.status === "DRAFT") {
    await draftFormSchema.validate(futureForm);
  } else {
    await sealedFormSchema.validate(futureForm);
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
    transporterCompanyVatNumber:
      form.transporterCompanyVatNumber ?? formCompanies.transporterCompanyVatNumber,
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

  if (isOrWillBeTempStorage && !(forwardedIn || temporaryStorageDetail)) {
    formUpdateInput.forwardedIn = {
      create: {
        owner: { connect: { id: user.id } },
        readableId: `${existingForm.readableId}-suite`
      }
    };
  }
  await checkIsFormContributor(
    user,
    nextFormCompanies,
    "Vous ne pouvez pas enlever votre établissement du bordereau"
  );

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

  const existingFormFractions = await prisma.form
    .findUnique({ where: { id: existingForm.id } })
    .grouping({ include: { initialForm: true } });

  const existingAppendix2Forms = existingFormFractions.map(
    ({ initialForm }) => initialForm
  );

  if (existingAppendix2Forms?.length) {
    const updatedSiret = formUpdateInput?.emitterCompanySiret;
    if (!!updatedSiret && updatedSiret !== existingForm?.emitterCompanySiret) {
      throw new UserInputError(
        "Des bordereaux figurent dans l'annexe 2, le siret de l'émetteur ne peut pas être modifié."
      );
    }
  }

  const isGroupementUpdated =
    !!grouping ||
    !!appendix2Forms ||
    futureForm.emitterType !== existingForm.emitterType;

  const appendix2 = isGroupementUpdated
    ? await validateGroupement(
        futureForm,
        grouping
          ? grouping
          : appendix2Forms
          ? appendix2toFormFractions(appendix2Forms)
          : existingFormFractions.map(({ quantity, initialFormId }) => ({
              form: { id: initialFormId },
              quantity
            }))
      )
    : null;

  const updatedForm = await runInTransaction(async transaction => {
    const { update, setAppendix2 } = getFormRepository(user, transaction);
    const updatedForm = await update({ id }, formUpdateInput);
    if (isGroupementUpdated) {
      await setAppendix2({
        form: updatedForm,
        appendix2,
        currentAppendix2Forms: existingAppendix2Forms
      });
    }
    return updatedForm;
  });

  return expandFormFromDb(updatedForm);
};

export default updateFormResolver;
