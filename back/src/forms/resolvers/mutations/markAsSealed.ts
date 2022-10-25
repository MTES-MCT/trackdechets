import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import { getFormOrFormNotFound } from "../../database";
import { expandFormFromDb } from "../../converter";
import { checkCanMarkAsSealed } from "../../permissions";
import {
  beforeSignedByTransporterSchema,
  checkCanBeSealed,
  validateForwardedInCompanies,
  wasteDetailsSchema
} from "../../validation";
import transitionForm from "../../workflow/transitionForm";
import { EventType } from "../../workflow/types";
import { sendMail } from "../../../mailer/mailing";
import { renderMail } from "../../../mailer/templates/renderers";
import { contentAwaitsGuest } from "../../../mailer/templates";
import { Form, Status } from "@prisma/client";
import { FormRepository, getFormRepository } from "../../repository";
import prisma from "../../../prisma";
import { runInTransaction } from "../../../common/repository/helper";

const markAsSealedResolver: MutationResolvers["markAsSealed"] = async (
  parent,
  { id },
  context
) => {
  const user = checkIsAuthenticated(context);
  const form = await getFormOrFormNotFound({ id });
  await checkCanMarkAsSealed(user, form);

  // validate form data
  await checkCanBeSealed(form);

  await validateForwardedInCompanies(form);
  let formUpdateInput = null;

  if (
    form.emitterIsForeignShip === true ||
    form.emitterIsPrivateIndividual === true
  ) {
    // pre-validate when signature by producer will be by-passed at the end of this mutation
    formUpdateInput = {
      emittedAt: new Date(),
      emittedBy: user.name,
      emittedByEcoOrganisme: false,
      // required for machine to authorize signature
      emitterIsForeignShip: form.emitterIsForeignShip,
      emitterIsPrivateIndividual: form.emitterIsPrivateIndividual
    };
    const futureForm: Form = {
      ...form,
      ...formUpdateInput
    };
    await wasteDetailsSchema.validate(futureForm);
    await beforeSignedByTransporterSchema.validate(futureForm);
  }

  const emitterCompanyExists = form.emitterCompanySiret
    ? (await prisma.company.count({
        where: { siret: form.emitterCompanySiret }
      })) > 0
    : false;

  const resultingForm = await runInTransaction(async transaction => {
    const formRepository = getFormRepository(user, transaction);
    const sealedForm = await formRepository.update(
      { id: form.id },
      {
        status: transitionForm(form, {
          type: EventType.MarkAsSealed
        })
      }
    );

    const appendix2Forms = await formRepository.findAppendix2FormsById(form.id);
    if (appendix2Forms.length > 0) {
      // mark appendix2Forms as GROUPED if all its grouping forms are sealed
      // and quantityGrouped is equal to quantityReceived
      await formRepository.updateAppendix2Forms(appendix2Forms);
    }

    // send welcome email to emitter if it is not registered in TD
    if (form.emitterCompanySiret && !emitterCompanyExists) {
      await mailToNonExistentEmitter(sealedForm, formRepository);
    }

    if (
      formUpdateInput &&
      (sealedForm.emitterIsForeignShip === true ||
        sealedForm.emitterIsPrivateIndividual === true)
    ) {
      return formRepository.update(
        { id: sealedForm.id },
        {
          status: transitionForm(sealedForm, {
            type: EventType.SignedByProducer,
            formUpdateInput
          }),
          ...formUpdateInput
        }
      );
    }

    return sealedForm;
  });

  return expandFormFromDb(resultingForm);
};

async function mailToNonExistentEmitter(
  form: Form,
  formRepository: FormRepository
) {
  // check contact email has not been mentionned already
  const contactAlreadyMentionned =
    (await formRepository.count({
      id: { not: form.id },
      emitterCompanyMail: form.emitterCompanyMail,
      status: { not: Status.DRAFT }
    })) > 0;
  if (!contactAlreadyMentionned) {
    await sendMail(
      renderMail(contentAwaitsGuest, {
        to: [
          {
            email: form.emitterCompanyMail,
            name: form.emitterCompanyContact
          }
        ],
        variables: {
          company: {
            siret: form.emitterCompanySiret,
            name: form.emitterCompanyName
          }
        }
      })
    );
  }
}

export default markAsSealedResolver;
