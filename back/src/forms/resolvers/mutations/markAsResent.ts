import type { MutationResolvers } from "@td/codegen-back";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getFormOrFormNotFound } from "../../database";
import { getAndExpandFormFromDb, flattenFormInput } from "../../converter";
import transitionForm from "../../workflow/transitionForm";
import { checkCanMarkAsResent } from "../../permissions";
import {
  validateForwardedInCompanies,
  sealedFormSchema
} from "../../validation";
import { EventType } from "../../workflow/types";
import { getFormRepository } from "../../repository";
import { EmitterType, Prisma, Status } from "@td/prisma";
import { UserInputError } from "../../../common/errors";
import { FormWithForwardedInWithTransportersInclude } from "../../types";

const markAsResentResolver: MutationResolvers["markAsResent"] = async (
  parent,
  args,
  context
) => {
  const user = checkIsAuthenticated(context);

  const { id, resentInfos } = args;

  const form = await getFormOrFormNotFound(
    { id },
    FormWithForwardedInWithTransportersInclude
  );

  const formRepository = getFormRepository(user);

  const { forwardedIn } =
    (await formRepository.findFullFormById(form.id)) ?? {};

  if (forwardedIn === null) {
    throw new UserInputError(
      "Ce bordereau ne correspond pas à un entreposage provisoire ou un reconditionnemnt"
    );
  }

  await checkCanMarkAsResent(user, form);

  const { destination, wasteDetails } = resentInfos;

  // copy basic info from initial BSD and overwrite it with resealedInfos
  const updateInput = {
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
    wasteDetailsNonRoadRegulationMention:
      form.wasteDetailsNonRoadRegulationMention,
    wasteDetailsPop: form.wasteDetailsPop,
    ...flattenFormInput({ wasteDetails, recipient: destination })
  };

  const bsdSuiteForValidation = {
    ...forwardedIn,
    ...updateInput
  };

  // validate input
  await sealedFormSchema.validate(bsdSuiteForValidation);

  // La validation doit s'appliquer sur les données de validation
  // (fusion de l'existant et de ce qui est contenu dans l'input)
  await validateForwardedInCompanies({
    destinationCompanySiret: bsdSuiteForValidation.recipientCompanySiret,
    transporterCompanySiret: null,
    transporterCompanyVatNumber: null
  });

  const forwardedInUpdateInput: Prisma.FormUpdateWithoutForwardingInput = {
    ...updateInput,
    status: Status.SEALED
  };

  const formUpdateInput: Prisma.FormUpdateInput = {
    forwardedIn: {
      update: forwardedInUpdateInput
    }
  };

  const resentForm = await getFormRepository(user).update(
    { id: form.id, status: form.status },
    {
      status: transitionForm(form, {
        type: EventType.MarkAsResent,
        formUpdateInput
      }),
      ...formUpdateInput
    }
  );
  return getAndExpandFormFromDb(resentForm.id);
};

export default markAsResentResolver;
