import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import { getFirstTransporterSync, getFormOrFormNotFound } from "../../database";
import {
  getAndExpandFormFromDb,
  flattenFormInput,
  flattenTransporterInput
} from "../../converter";
import { checkCanMarkAsResealed } from "../../permissions";
import {
  validateForwardedInCompanies,
  sealedFormSchema,
  Transporter
} from "../../validation";
import transitionForm from "../../workflow/transitionForm";
import { EventType } from "../../workflow/types";
import {
  EmitterType,
  Form,
  Prisma,
  QuantityType,
  Status
} from "@prisma/client";
import { getFormRepository } from "../../repository";
import { sirenifyResealedFormInput } from "../../sirenify";
import { prismaJsonNoNull } from "../../../common/converter";
import { bsddWasteQuantities } from "../../helpers/bsddWasteQuantities";

const markAsResealed: MutationResolvers["markAsResealed"] = async (
  parent,
  args,
  context
) => {
  const user = checkIsAuthenticated(context);

  const { id, resealedInfos } = args;

  const form = await getFormOrFormNotFound({ id });

  const formRepository = getFormRepository(user);

  const { forwardedIn } =
    (await formRepository.findFullFormById(form.id)) ?? {};

  // markAsResealed can be called several times to update BSD suite data
  const existingForwardedInTransporter = forwardedIn
    ? getFirstTransporterSync(forwardedIn)
    : null;

  await checkCanMarkAsResealed(user, form);

  const {
    destination,
    transporter: transporterInput,
    wasteDetails
  } = await sirenifyResealedFormInput(resealedInfos, user);

  const wasteQuantities = bsddWasteQuantities({
    wasteAcceptationStatus: form.wasteAcceptationStatus,
    quantityReceived: form.quantityReceived,
    quantityRefused: form.quantityRefused
  });

  // copy basic info from initial BSD and overwrite it with resealedInfos
  const updateInput = {
    emitterType: EmitterType.PRODUCER,
    emittedByEcoOrganisme: false,
    emitterCompanySiret: form.recipientCompanySiret,
    emitterCompanyName: form.recipientCompanyName,
    emitterCompanyAddress: form.recipientCompanyAddress,
    emitterCompanyContact: form.recipientCompanyContact,
    emitterCompanyMail: form.recipientCompanyMail,
    emitterCompanyPhone: form.recipientCompanyPhone,
    wasteDetailsCode: form.wasteDetailsCode,
    wasteDetailsConsistence: form.wasteDetailsConsistence,
    wasteDetailsIsDangerous: form.wasteDetailsIsDangerous,
    wasteDetailsName: form.wasteDetailsName,
    wasteDetailsIsSubjectToADR: form.wasteDetailsIsSubjectToADR,
    wasteDetailsOnuCode: form.wasteDetailsOnuCode,
    wasteDetailsPop: form.wasteDetailsPop,
    wasteDetailsQuantityType: QuantityType.REAL,
    wasteDetailsQuantity:
      wasteQuantities?.quantityAccepted ?? form.quantityReceived,
    wasteDetailsPackagingInfos: prismaJsonNoNull(
      form.wasteDetailsPackagingInfos
    ),
    wasteDetailsAnalysisReferences: [],
    wasteDetailsLandIdentifiers: [],
    ...flattenFormInput({ wasteDetails, recipient: destination })
  };

  let transporters: Prisma.BsddTransporterUpdateManyWithoutFormNestedInput = {}; // payload de nested write Prisma
  const transportersForValidation: Transporter[] = []; // payload de validation

  if (transporterInput === null && existingForwardedInTransporter) {
    // there should be only one transporter allowed on the BSD suite
    transporters = { deleteMany: {} };
  } else if (transporterInput) {
    const transporterData = flattenTransporterInput({
      transporter: transporterInput
    });
    if (existingForwardedInTransporter) {
      // On modifie les données du transporteur
      transporters = {
        update: {
          where: { id: existingForwardedInTransporter.id },
          data: transporterData
        }
      };
      transportersForValidation.push({
        ...existingForwardedInTransporter,
        ...transporterData
      });
    } else {
      // Aucun transporteur n'a encore été associé, let's create one
      transporters.create = {
        ...transporterData,
        number: 1,
        readyToTakeOver: true
      };
    }
    transportersForValidation.push(transporterData);
  }

  // validate input
  await sealedFormSchema.validate({
    ...forwardedIn,
    ...updateInput,
    transporters: transportersForValidation
  });

  await validateForwardedInCompanies(form);

  let formUpdateInput: Prisma.FormUpdateInput = {};

  if (forwardedIn === null) {
    // The recipient decides to forward the BSD even if it has not been
    // flagged as temporary storage before
    const forwardedInCreateInput: Prisma.FormCreateWithoutForwardingInput = {
      owner: { connect: { id: user.id } },
      readableId: `${form.readableId}-suite`,
      ...updateInput,
      status: Status.SEALED,
      transporters
    };

    formUpdateInput = {
      recipientIsTempStorage: true,
      forwardedIn: { create: forwardedInCreateInput }
    };
  } else {
    const forwardedInUpdateInput: Prisma.FormUpdateWithoutForwardingInput = {
      ...updateInput,
      status: Status.SEALED,
      transporters
    };
    formUpdateInput = {
      forwardedIn: { update: forwardedInUpdateInput }
    };
  }

  let resealedForm: Form | null = null;
  if (form.status === Status.RESEALED) {
    // by pass xstate transition because markAsResealed is
    // used to update an already resealed form
    resealedForm = await formRepository.update({ id }, formUpdateInput);
  } else {
    resealedForm = await formRepository.update(
      { id: form.id, status: form.status },
      {
        status: transitionForm(form, {
          type: EventType.MarkAsResealed,
          formUpdateInput
        }),
        ...formUpdateInput
      }
    );
  }

  return getAndExpandFormFromDb(resealedForm.id);
};

export default markAsResealed;
