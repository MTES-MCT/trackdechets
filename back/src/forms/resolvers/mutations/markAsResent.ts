import { MutationResolvers } from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getFormOrFormNotFound } from "../../database";
import { expandFormFromDb, flattenFormInput } from "../../converter";
import transitionForm from "../../workflow/transitionForm";
import { checkCanMarkAsResent } from "../../permissions";
import {
  validateForwardedInCompanies,
  sealedFormSchema
} from "../../validation";
import { EventType } from "../../workflow/types";
import { getFormRepository } from "../../repository";
import { EmitterType, Prisma, Status } from "@prisma/client";
import { UserInputError } from "../../../common/errors";

const markAsResentResolver: MutationResolvers["markAsResent"] = async (
  parent,
  args,
  context
) => {
  const user = checkIsAuthenticated(context);

  const { id, resentInfos } = args;

  const form = await getFormOrFormNotFound({ id });

  const formRepository = getFormRepository(user);

  const { forwardedIn } =
    (await formRepository.findFullFormById(form.id)) ?? {};

  if (forwardedIn === null) {
    throw new UserInputError(
      "Ce bordereau ne correspond pas à un entreposage provisoire ou un reconditionnemnt"
    );
  }

  await checkCanMarkAsResent(user, form);

  const { destination, transporter, wasteDetails } = resentInfos;

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
    ...flattenFormInput({ transporter, wasteDetails, recipient: destination })
  };

  // validate input
  await sealedFormSchema.validate({
    ...forwardedIn,
    ...updateInput
  });

  await validateForwardedInCompanies(form);

  const formUpdateInput: Prisma.FormUpdateInput = {
    forwardedIn: {
      update: { ...updateInput, status: Status.SENT }
    }
  };

  const resentForm = await getFormRepository(user).update(
    { id: form.id },
    {
      status: transitionForm(form, {
        type: EventType.MarkAsResent,
        formUpdateInput
      }),
      ...formUpdateInput
    }
  );
  return expandFormFromDb(resentForm);
};

export default markAsResentResolver;
