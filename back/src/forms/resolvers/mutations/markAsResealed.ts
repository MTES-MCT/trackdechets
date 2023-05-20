import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import { getFirstTransporterSync, getFormOrFormNotFound } from "../../database";
import {
  expandFormFromDb,
  flattenFormInput,
  flattenTransporterInput
} from "../../converter";
import { checkCanMarkAsResealed } from "../../permissions";
import {
  validateForwardedInCompanies,
  sealedFormSchema
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
import { recipifyResealedFormInput } from "../../recipify";
import { prismaJsonNoNull } from "../../../common/converter";

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

  const forwardedInTransporter = forwardedIn
    ? getFirstTransporterSync(forwardedIn)
    : null;

  await checkCanMarkAsResealed(user, form);

  const sirenified = await sirenifyResealedFormInput(resealedInfos, user);
  const { destination, transporter, wasteDetails } =
    await recipifyResealedFormInput(sirenified);

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
    wasteDetailsOnuCode: form.wasteDetailsOnuCode,
    wasteDetailsPop: form.wasteDetailsPop,
    wasteDetailsQuantityType: QuantityType.REAL,
    wasteDetailsQuantity: form.quantityReceived,
    wasteDetailsPackagingInfos: prismaJsonNoNull(
      form.wasteDetailsPackagingInfos
    ),
    wasteDetailsAnalysisReferences: [],
    wasteDetailsLandIdentifiers: [],
    ...flattenFormInput({ wasteDetails, recipient: destination })
  };

  const forwardedInTransporterUpdateInput = flattenTransporterInput({
    transporter
  });

  // validate input
  await sealedFormSchema.validate({
    ...forwardedInTransporter,
    ...forwardedInTransporterUpdateInput,
    ...forwardedIn,
    ...updateInput
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
      ...(transporter
        ? {
            transporters: {
              create: { ...forwardedInTransporterUpdateInput, number: 1 }
            }
          }
        : {})
    };

    formUpdateInput = {
      recipientIsTempStorage: true,
      forwardedIn: { create: forwardedInCreateInput }
    };
  } else {
    const forwardedInUpdateInput: Prisma.FormUpdateWithoutForwardingInput = {
      ...updateInput,
      status: Status.SEALED
    };
    if (transporter) {
      if (forwardedInTransporter) {
        forwardedInUpdateInput.transporters = {
          update: {
            where: { id: forwardedInTransporter.id },
            data: forwardedInTransporterUpdateInput
          }
        };
      } else {
        forwardedInUpdateInput.transporters = {
          create: { ...forwardedInTransporterUpdateInput, number: 1 }
        };
      }
    }
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
      { id: form.id },
      {
        status: transitionForm(form, {
          type: EventType.MarkAsResealed,
          formUpdateInput
        }),
        ...formUpdateInput
      }
    );
  }

  return expandFormFromDb(resealedForm);
};

export default markAsResealed;
