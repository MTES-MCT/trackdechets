import { UserInputError } from "apollo-server-express";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import { getFormOrFormNotFound } from "../../database";
import { expandFormFromDb, flattenFormInput } from "../../form-converter";
import { checkCanMarkAsResealed } from "../../permissions";
import { checkCompaniesType, sealedFormSchema } from "../../validation";
import transitionForm from "../../workflow/transitionForm";
import { EventType } from "../../workflow/types";
import { EmitterType, Form, Prisma, Status } from "@prisma/client";
import { getFormRepository } from "../../repository";

const markAsResealed: MutationResolvers["markAsResealed"] = async (
  parent,
  args,
  context
) => {
  const user = checkIsAuthenticated(context);

  const { id, resealedInfos } = args;

  const form = await getFormOrFormNotFound({ id });
  const formRepository = getFormRepository(user);

  const { forwardedIn } = await formRepository.findFullFormById(form.id);

  if (forwardedIn === null) {
    throw new UserInputError(
      "Ce bordereau ne correspond pas à un entreposage provisoire ou un reconditionnemnt"
    );
  }

  await checkCanMarkAsResealed(user, form);

  const { destination, transporter, wasteDetails } = resealedInfos;

  // copy basic info from initial BSD and overwrite it with resealedInfos
  const updateInput: Prisma.FormUpdateInput = {
    emitterType: EmitterType.PRODUCER,
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
    wasteDetailsQuantityType: "REAL",
    wasteDetailsQuantity: form.quantityReceived,
    wasteDetailsPackagingInfos: form.wasteDetailsPackagingInfos,
    ...flattenFormInput({ transporter, wasteDetails, recipient: destination })
  };

  // validate input
  await sealedFormSchema.validate({
    ...forwardedIn,
    ...updateInput
  });

  await checkCompaniesType(form);

  const formUpdateInput: Prisma.FormUpdateInput = {
    forwardedIn: {
      update: { ...updateInput, status: Status.SEALED }
    }
  };

  let resealedForm: Form | null = null;

  if (form.status === Status.RESEALED) {
    // by pass xstate transition because markAsResealed is
    // used to update an already resealed form
    resealedForm = await formRepository.update({ id }, formUpdateInput);
  } else {
    resealedForm = await transitionForm(user, form, {
      type: EventType.MarkAsResealed,
      formUpdateInput
    });
  }

  return expandFormFromDb(resealedForm);
};

export default markAsResealed;
