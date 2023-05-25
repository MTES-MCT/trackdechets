import { EmitterType, Form, Prisma, TransportMode } from "@prisma/client";
import { isDangerous, BSDD_WASTE_CODES } from "../../../common/constants";
import { checkIsAuthenticated } from "../../../common/permissions";
import {
  MutationUpdateFormArgs,
  ResolversParentTypes,
  UpdateFormInput
} from "../../../generated/graphql/types";
import { InvalidWasteCode, MissingTempStorageFlag } from "../../errors";
import { checkCanUpdate } from "../../permissions";
import { GraphQLContext } from "../../../types";
import { getFormOrFormNotFound } from "../../database";
import {
  expandFormFromDb,
  flattenFormInput,
  flattenTemporaryStorageDetailInput,
  flattenTransporterInput
} from "../../converter";
import { getFormRepository } from "../../repository";
import {
  draftFormSchema,
  hasPipeline,
  sealedFormSchema,
  validateGroupement
} from "../../validation";
import prisma from "../../../prisma";
import { UserInputError } from "apollo-server-core";
import { appendix2toFormFractions } from "../../compat";
import { runInTransaction } from "../../../common/repository/helper";
import { sirenifyFormInput } from "../../sirenify";
import { validateIntermediariesInput } from "../../../common/validation";

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

  const id = updateFormInput.id;

  const {
    appendix2Forms,
    grouping,
    temporaryStorageDetail,
    intermediaries,
    transporter2,
    transporter3,
    transporter4,
    transporter5,
    ...formContent
  } = await sirenifyFormInput(updateFormInput, user);

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

  await checkCanUpdate(user, existingForm, updateFormInput);

  const form = flattenFormInput(formContent);
  const futureForm = { ...existingForm, ...form };
  // Pipeline erases transporter EXCEPT for transporterTransportMode
  if (hasPipeline(form as any)) {
    Object.keys(form)
      .filter(key => key.startsWith("transporter"))
      .forEach(key => {
        form[key] = null;
      });
    form.transporterTransportMode = TransportMode.OTHER;
    // update futureForm  only for yup validation
    Object.keys(futureForm)
      .filter(key => key.startsWith("transporter"))
      .forEach(key => {
        futureForm[key] = null;
      });
  }
  // Construct form update payload
  // This bit is a bit confusing. We are NOT in strict mode, so Yup doesnt complain if we pass unknown values.
  // To remove those unknown values, we cast the object. This makes sure our input has a shape that fits our validator
  // But upon casting, somes keys might "appear": a yup.string() will be casted to an empty string even if it was undefined in the first place.
  // To remediate this, after casting we remove the keys that were not present initially.
  // So this is a 2 way constraint:
  // - casting remove keys in the input but unknown to the validator
  // - then we remove keys present in the casting result but not present in the input
  let formUpdateInput: Prisma.FormUpdateInput = draftFormSchema.cast(form);
  for (const key of Object.keys(formUpdateInput)) {
    if (!(key in form)) {
      delete formUpdateInput[key];
    }
  }

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

  if (isOrWillBeTempStorage && !(forwardedIn || temporaryStorageDetail)) {
    formUpdateInput.forwardedIn = {
      create: {
        owner: { connect: { id: user.id } },
        readableId: `${existingForm.readableId}-suite`
      }
    };
  }

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
    await validateIntermediariesInput(intermediaries);
    // Update the intermediaties
    const existingIntermediaries =
      await prisma.intermediaryFormAssociation.findMany({
        where: { formId: existingForm.id }
      });
    // combine existing info with update info
    const intermediariesInput = intermediaries.map(companyInput => {
      const match = existingIntermediaries.find(
        ({ siret }) => siret === companyInput.siret
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
        data: intermediariesInput.map(i => ({
          name: i.name!, // enforced through validation schema
          siret: i.siret!, // enforced through validation schema
          contact: i.contact!, // enforced through validation schema
          address: i.address,
          vatNumber: i.vatNumber,
          phone: i.phone,
          mail: i.mail
        })),
        skipDuplicates: true
      }
    };
  }

  const existingFormFractions = await prisma.form
    .findUnique({ where: { id: existingForm.id } })
    .grouping({ include: { initialForm: true } });

  const existingAppendixForms =
    existingFormFractions?.map(({ initialForm }) => initialForm) ?? [];

  if (existingAppendixForms.length) {
    const updatedSiret = formUpdateInput?.emitterCompanySiret;
    if (!!updatedSiret && updatedSiret !== existingForm?.emitterCompanySiret) {
      throw new UserInputError(
        "Des bordereaux figurent dans l'annexe, le siret de l'émetteur ne peut pas être modifié."
      );
    }
  }

  const isGroupementUpdated =
    !!grouping ||
    !!appendix2Forms ||
    futureForm.emitterType !== existingForm.emitterType;

  const existingFormFractionsInput = existingFormFractions?.map(
    ({ quantity, initialFormId }) => ({
      form: { id: initialFormId },
      quantity
    })
  );

  const formFractionsInput = grouping
    ? grouping
    : appendix2Forms
    ? appendix2toFormFractions(appendix2Forms)
    : existingFormFractionsInput;
  const formFractions = isGroupementUpdated
    ? await validateGroupement(futureForm as any, formFractionsInput!)
    : null;

  if (
    transporter2 !== undefined ||
    transporter3 !== undefined ||
    transporter4 !== undefined ||
    transporter5 !== undefined
  ) {
    formUpdateInput = {
      ...formUpdateInput,
      ...(await getMultiModalTransportersUpdateInput(
        existingForm,
        updateFormInput
      ))
    };
  }
  const updatedForm = await runInTransaction(async transaction => {
    const { update, setAppendix1, setAppendix2 } = getFormRepository(
      user,
      transaction
    );
    const updatedForm = await update({ id }, formUpdateInput);
    if (isGroupementUpdated) {
      updatedForm.emitterType === EmitterType.APPENDIX1
        ? await setAppendix1({
            form: updatedForm,
            appendix1: formFractions!,
            currentAppendix1Forms: existingAppendixForms
          })
        : await setAppendix2({
            form: updatedForm,
            appendix2: formFractions!,
            currentAppendix2Forms: existingAppendixForms
          });
    }
    return updatedForm;
  });

  return expandFormFromDb(updatedForm);
};

export default updateFormResolver;

async function getMultiModalTransportersUpdateInput(
  form: Form,
  { transporter2, transporter3, transporter4, transporter5 }: UpdateFormInput
): Promise<Prisma.FormUpdateInput> {
  const multiModalFormUpdateInput: Prisma.FormUpdateInput = {};

  // TODO : we should throw an error here if there is no transporter N
  // and we try to set transporter N+1

  [transporter2, transporter3, transporter4, transporter5].forEach(
    (transporterN, idx) => {
      const N = idx + 2;

      if (transporterN === null && form[`transporter${N}Id`]) {
        multiModalFormUpdateInput[`transporter${N}`] = { delete: true };
      }
      if (transporterN && !form[`transporter${N}Id`]) {
        multiModalFormUpdateInput[`transporter${N}`] = {
          create: {
            ...flattenTransporterInput({ transporter: transporterN }),
            form: { connect: { id: form.id } },
            segmentNumber: N - 1,
            readyToTakeOver: true
          }
        };
      }
      if (transporterN && form[`transporter${N}Id`]) {
        multiModalFormUpdateInput[`transporter${N}`] = {
          update: {
            ...flattenTransporterInput({ transporter: transporterN })
          }
        };
      }
    }
  );

  return multiModalFormUpdateInput;
}
