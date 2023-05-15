import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import { getFormOrFormNotFound } from "../../database";
import { expandFormFromDb, flattenFormInput } from "../../converter";
import { checkCanMarkAsResealed } from "../../permissions";
import {
  validateForwardedInCompanies,
  sealedFormSchema,
  checkForClosedCompanies
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

  await checkCanMarkAsResealed(user, form);

  const { destination, transporter, wasteDetails } =
    await sirenifyResealedFormInput(resealedInfos, user);

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
    ...flattenFormInput({ transporter, wasteDetails, recipient: destination })
  };

  // validate input
  await sealedFormSchema.validate({
    ...forwardedIn,
    ...updateInput
  });

  await validateForwardedInCompanies(form);

  const formUpdateInput: Prisma.FormUpdateInput =
    forwardedIn === null
      ? // The recipient decides to forward the BSD even if it has not been
        // flagged as temporary storage before
        {
          recipientIsTempStorage: true,
          forwardedIn: {
            create: {
              owner: { connect: { id: user.id } },
              readableId: `${form.readableId}-suite`,
              ...updateInput,
              status: Status.SEALED
            }
          }
        }
      : {
          forwardedIn: {
            update: { ...updateInput, status: Status.SEALED }
          }
        };
  /**
   * Check for closed companies or throw an exception
   */
  if (process.env.VERIFY_COMPANY === "true") {
    await checkForClosedCompanies(form.id);
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
