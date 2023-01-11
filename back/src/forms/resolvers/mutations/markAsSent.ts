import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import { getFormOrFormNotFound } from "../../database";
import { expandFormFromDb } from "../../converter";
import { checkCanMarkAsSent } from "../../permissions";
import { checkCanBeSealed, signingInfoSchema } from "../../validation";
import transitionForm from "../../workflow/transitionForm";
import { EventType } from "../../workflow/types";
import { getFormRepository } from "../../repository";
import { runInTransaction } from "../../../common/repository/helper";
import { getTransporterCompanyOrgId } from "../../../common/constants/companySearchHelpers";

const markAsSentResolver: MutationResolvers["markAsSent"] = async (
  parent,
  args,
  context
) => {
  const user = checkIsAuthenticated(context);

  const { id, sentInfo } = args;

  const form = await getFormOrFormNotFound({ id });

  await checkCanMarkAsSent(user, form);

  if (form.status === "DRAFT") {
    // check it can be sealed
    await checkCanBeSealed(form);
  }

  // validate input
  await signingInfoSchema.validate(sentInfo);

  // when form is sent, we store transporterCompanySiret as currentTransporterSiret to ease multimodal management
  const formUpdateInput = {
    ...sentInfo,
    sentAt: new Date(sentInfo.sentAt),
    currentTransporterSiret: getTransporterCompanyOrgId(form),
    signedByTransporter: false
  };

  const appendix2Forms = await getFormRepository(user).findAppendix2FormsById(
    form.id
  );

  const resentForm = await runInTransaction(async transaction => {
    const { updateAppendix2Forms, update } = getFormRepository(
      user,
      transaction
    );

    const resentForm = await update(
      { id: form.id },
      {
        status: transitionForm(form, {
          type: EventType.MarkAsSent,
          formUpdateInput
        }),
        ...formUpdateInput
      }
    );

    if (appendix2Forms.length > 0) {
      // mark appendix2Forms as GROUPED if all its grouping forms are sealed
      // and quantityGrouped is equal to quantityReceived
      await updateAppendix2Forms(appendix2Forms);
    }

    return resentForm;
  });

  return expandFormFromDb(resentForm);
};

export default markAsSentResolver;
