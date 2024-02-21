import { EmitterType, Prisma, TransportMode } from "@prisma/client";
import { isDangerous } from "@td/constants";
import { checkIsAuthenticated } from "../../../common/permissions";
import {
  MutationCreateFormArgs,
  ResolversParentTypes
} from "../../../generated/graphql/types";
import { GraphQLContext } from "../../../types";
import { MissingTempStorageFlag } from "../../errors";
import {
  getAndExpandFormFromDb,
  flattenFormInput,
  flattenTemporaryStorageDetailInput,
  flattenTransporterInput
} from "../../converter";
import getReadableId from "../../readableId";
import { getFormRepository } from "../../repository";
import {
  Transporter,
  draftFormSchema,
  hasPipeline,
  validateGroupement
} from "../../validation";
import { appendix2toFormFractions } from "../../compat";
import { runInTransaction } from "../../../common/repository/helper";
import { validateIntermediariesInput } from "../../../common/validation";
import { sirenifyFormInput } from "../../sirenify";
import { recipifyFormInput } from "../../recipify";
import { checkCanCreate } from "../../permissions";
import { UserInputError } from "../../../common/errors";
import { prisma } from "@td/prisma";

const createFormResolver = async (
  parent: ResolversParentTypes["Mutation"],
  { createFormInput }: MutationCreateFormArgs,
  context: GraphQLContext
) => {
  const user = checkIsAuthenticated(context);

  const sirenifiedFormInput = await sirenifyFormInput(createFormInput, user);

  const {
    appendix2Forms,
    grouping,
    temporaryStorageDetail,
    intermediaries,
    ...formContent
  } = await recipifyFormInput(sirenifiedFormInput);

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

  // APPENDIX1_PRODUCER is the only type of forms for which you don't necessarely appear during creation.
  // The destination and transporter will be auto completed
  if (formContent?.emitter?.type !== "APPENDIX1_PRODUCER") {
    await checkCanCreate(user, createFormInput);
  }

  const form = flattenFormInput(formContent);

  if (formContent.transporter && formContent.transporters) {
    throw new UserInputError(
      "Vous ne pouvez pas utiliser les champs `transporter` et `transporters` en même temps"
    );
  }

  let transporters: Prisma.BsddTransporterCreateNestedManyWithoutFormInput = {}; // payload de nested write Prisma
  let transportersForValidation: Transporter[] = []; // payload de validation

  if (formContent.transporter) {
    // Lorsque l'ancien champ `transporter` est spécifié, on crée
    // un nouveau enregistrement dans la table BsddTransporter et on
    // l'associe au bordereau
    transporters.create = {
      ...flattenTransporterInput(formContent),
      number: 1,
      readyToTakeOver: true
    };
    transportersForValidation.push(transporters.create);
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
    transportersForValidation = [
      ...transportersForValidation,
      ...dbTransporters
    ];
    // Lorsque le champs `transporters` est passé, on connecte les enregistrements
    // de la table `BsddTransporter` avec ce bordereau. La fonction `create`
    // du repository s'assure que la numérotation des transporteurs correspondent à
    // l'ordre du tableau d'identifiants.
    transporters = {
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
      create: {
        number: 1,
        transporterTransportMode: TransportMode.OTHER
      }
    };
    transportersForValidation = [];
  }

  // Do not take into account user sent transporter data in case of APPENDIX1_PRODUCER
  // Transporter data will be copied from the bordereau chapeau
  if (form.emitterType === "APPENDIX1_PRODUCER") {
    delete transporters.create;
    delete transporters.connect;
    transportersForValidation = [];
  }

  const readableId = getReadableId();

  const cleanedForm = await draftFormSchema.validate({
    ...form,
    transporters: transportersForValidation
  });

  // `cleanedForm` was introduced for the annexe 1 to get only the keys from
  // the annexe 1 yup schema. The problem is that it also returns
  // fields that should not be included in the FormCreateInput.
  if (cleanedForm) {
    for (const key of Object.keys(cleanedForm)) {
      if (!(key in form)) {
        delete cleanedForm[key];
      }
    }
  }

  const formCreateInput: Prisma.FormCreateInput = {
    ...cleanedForm,
    readableId,
    owner: { connect: { id: user.id } },
    transporters
  };

  if (temporaryStorageDetail) {
    if (formContent.recipient?.isTempStorage !== true) {
      // The user is trying to set a temporary storage without
      // recipient.isTempStorage=true, throw error
      throw new MissingTempStorageFlag();
    }
    formCreateInput.forwardedIn = {
      create: {
        owner: { connect: { id: user.id } },
        readableId: `${readableId}-suite`,
        ...flattenTemporaryStorageDetailInput(temporaryStorageDetail)
      }
    };
  } else {
    if (formContent.recipient?.isTempStorage === true) {
      // Recipient is temp storage but no details provided
      // Create empty temporary storage details
      formCreateInput.forwardedIn = {
        create: {
          owner: { connect: { id: user.id } },
          readableId: `${readableId}-suite`
        }
      };
    }
  }

  if (intermediaries) {
    await validateIntermediariesInput(intermediaries);
    formCreateInput.intermediaries = {
      createMany: {
        data: intermediaries.map(i => ({
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

  const isGroupement =
    (grouping && grouping.length > 0) ||
    (appendix2Forms && appendix2Forms.length > 0);
  const formFractions = isGroupement
    ? await validateGroupement(
        formCreateInput,
        grouping && grouping.length > 0
          ? grouping
          : appendix2toFormFractions(appendix2Forms!)
      )
    : null;

  const newForm = await runInTransaction(async transaction => {
    const { create, setAppendix1, setAppendix2 } = getFormRepository(
      user,
      transaction
    );
    const newForm = await create(formCreateInput);
    if (isGroupement) {
      newForm.emitterType === EmitterType.APPENDIX1
        ? await setAppendix1({
            form: newForm,
            newAppendix1Fractions: formFractions!,
            currentAppendix1Forms: []
          })
        : await setAppendix2({
            form: newForm,
            appendix2: formFractions!,
            currentAppendix2Forms: []
          });
    }

    return newForm;
  });

  return getAndExpandFormFromDb(newForm.id);
};

export default createFormResolver;
