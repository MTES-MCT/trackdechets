import { EmitterType, Prisma, TransportMode } from "@prisma/client";
import { isDangerous, BSDD_WASTE_CODES } from "@td/constants";
import { checkIsAuthenticated } from "../../../common/permissions";
import type {
  MutationUpdateFormArgs,
  ResolversParentTypes
} from "@td/codegen-back";
import { InvalidWasteCode, MissingTempStorageFlag } from "../../errors";
import { checkCanUpdate } from "../../permissions";
import { GraphQLContext } from "../../../types";
import {
  getFirstTransporterSync,
  getFormOrFormNotFound,
  getFullForm
} from "../../database";
import {
  getAndExpandFormFromDb,
  flattenFormInput,
  flattenTemporaryStorageDetailInput,
  flattenTransporterInput
} from "../../converter";
import { getFormRepository } from "../../repository";
import {
  Transporter,
  draftFormSchema,
  hasPipeline,
  sealedFormSchema,
  validateGroupement,
  validateIntermediaries
} from "../../validation";
import { prisma } from "@td/prisma";
import { appendix2toFormFractions } from "../../compat";
import { runInTransaction } from "../../../common/repository/helper";
import { sirenifyFormInput } from "../../sirenify";
import { recipifyFormInput } from "../../recipify";
import { UserInputError } from "../../../common/errors";
import { checkEditionRules } from "../../edition";

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

  const sirenifiedFormInput = await sirenifyFormInput(updateFormInput, user);

  const {
    appendix2Forms,
    grouping,
    temporaryStorageDetail,
    intermediaries,
    ...formContent
  } = await recipifyFormInput(sirenifiedFormInput);

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
  const existingFullForm = await getFullForm(existingForm);

  const existingTransporters = existingFullForm.transporters;

  const existingFirstTransporter = getFirstTransporterSync({
    transporters: existingTransporters
  });

  // Vérifie que l'utilisateur fait bien partie d'un établissement
  // qui apparait sur le bordereau et qu'il n'essaye pas d'enlever son
  // établissement du bordereau
  await checkCanUpdate(user, existingForm, updateFormInput);

  /// Vérifie en plus que les champs qui sont modifiés n'ont pas été
  // verrouillés par une signature
  await checkEditionRules(existingFullForm, updateFormInput, user);

  const form = flattenFormInput(formContent);

  let transporters: Prisma.BsddTransporterUpdateManyWithoutFormNestedInput = {}; // payload de nested write Prisma

  let transportersForValidation: Transporter[] = existingTransporters; // payload de validation

  if (formContent.transporter === null && existingFirstTransporter) {
    // On supprime le premier transporteur en gardant les suivants (s'ils existent)
    // L'ordre des transporteurs se décale.
    transporters = { delete: { id: existingFirstTransporter.id } };
    transportersForValidation.shift();
  } else if (formContent.transporter) {
    const transporterData = flattenTransporterInput(formContent);
    if (existingFirstTransporter) {
      // On modifie les données du 1er transporteur
      // Les transporteurs suivants (s'ils existent) ne sont pas modifiés
      transporters = {
        update: {
          where: { id: existingFirstTransporter.id },
          data: transporterData
        }
      };
      // on remplace le premier transporteur par la fusion du trs en db et du payload
      // on conserve la chaîne eventuelle de transporteurs car certaines validations portent sur l'ensemble des transporteurs
      // (eg. poids max et mode de transport)
      transportersForValidation[0] = {
        ...existingFirstTransporter,
        ...transporterData
      };
    } else {
      // Aucun transporteur n'a encore été associé, let's create one
      transporters.create = {
        ...transporterData,
        number: 1,
        readyToTakeOver: true
      };
      transportersForValidation.push(transporterData);
    }
  } else if (formContent.transporters) {
    const dbTransporters = await prisma.bsddTransporter.findMany({
      where: { id: { in: formContent.transporters } }
    });
    // check all identifiers has a matching record in DB
    const unknowTransporters = formContent.transporters.filter(
      id => !dbTransporters.map(t => t.id).includes(id)
    );
    if (unknowTransporters.length > 0) {
      throw new UserInputError(
        `Aucun transporteur ne possède le ou les identifiants suivants : ${unknowTransporters.join(
          ", "
        )}`
      );
    }
    transportersForValidation = dbTransporters;
    // Lorsque le champs `transporters` est passé, on déconnecte tous les transporteurs qui étaient
    // précédement associés et on connecte les nouveaux transporteurs de la table `BsddTransporter`
    // avec ce bordereau. La fonction `update` du repository s'assure que la numérotation des
    // transporteurs correspond à l'ordre du tableau d'identifiants.
    transporters = {
      set: [],
      connect: formContent.transporters.map(id => ({
        id
      }))
    };
  }

  // Pipeline erases transporter EXCEPT for transporterTransportMode
  // FIXME here we have a silent side effect. It would be be better to throw an
  // exception is the transporter data sent by the user does not comply
  if (hasPipeline(form as any)) {
    transporters = {
      deleteMany: {},
      create: {
        number: 1,
        transporterTransportMode: TransportMode.OTHER
      }
    };
    transportersForValidation = [];
  }

  const futureForm = {
    ...existingForm,
    ...form,
    transporters: transportersForValidation
  };

  // Construct form update payload
  // This bit is a bit confusing. We are NOT in strict mode, so Yup doesnt complain if we pass unknown values.
  // To remove those unknown values, we cast the object. This makes sure our input has a shape that fits our validator
  // But upon casting, somes keys might "appear": a yup.string() will be casted to an empty string even if it was undefined in the first place.
  // To remediate this, after casting we remove the keys that were not present initially.
  // So this is a 2 way constraint:
  // - casting remove keys in the input but unknown to the validator
  // - then we remove keys present in the casting result but not present in the input
  const formUpdateInput: Prisma.FormUpdateInput =
    draftFormSchema.cast(form) ?? {};
  for (const key of Object.keys(formUpdateInput)) {
    if (!(key in form)) {
      delete formUpdateInput[key];
    }
    if (form[key] === null && formUpdateInput[key] === "") {
      // Reverse le casting lorsque `null` est converti
      // en chaine de caractère vide
      formUpdateInput[key] = null;
    }
  }

  formUpdateInput.transporters = transporters;

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
    await validateIntermediaries(intermediaries, form);
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

  const updatedForm = await runInTransaction(async transaction => {
    const { update, setAppendix1, setAppendix2 } = getFormRepository(
      user,
      transaction
    );
    const updatedForm = await update({ id }, formUpdateInput);

    if (updatedForm.emitterType === EmitterType.APPENDIX1) {
      await setAppendix1({
        form: updatedForm,
        newAppendix1Fractions: formFractions,
        currentAppendix1Forms: existingAppendixForms
      });
    }

    if (
      updatedForm.emitterType !== EmitterType.APPENDIX1 &&
      isGroupementUpdated
    ) {
      await setAppendix2({
        form: updatedForm,
        appendix2: formFractions!,
        currentAppendix2Forms: existingAppendixForms
      });
    }
    return updatedForm;
  });

  return getAndExpandFormFromDb(updatedForm.id);
};

export default updateFormResolver;
