import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import { getFormOrFormNotFound } from "../../database";
import { expandFormFromDb } from "../../form-converter";
import { checkCanMarkAsSealed } from "../../permissions";
import {
  beforeSignedByTransporterSchema,
  checkCanBeSealed,
  checkCompaniesType,
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

  await checkCompaniesType(form);
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

  const formRepository = getFormRepository(user);
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

  if (form.emitterCompanySiret) {
    // send welcome email to emitter if it is not registered in TD
    const emitterCompanyExists =
      (await prisma.company.count({
        where: { siret: form.emitterCompanySiret }
      })) > 0;

    if (!emitterCompanyExists) {
      await mailToNonExistentEmitter(sealedForm, formRepository);
    }
  }

  if (
    formUpdateInput &&
    (sealedForm.emitterIsForeignShip === true ||
      sealedForm.emitterIsPrivateIndividual === true)
  ) {
    const updatedForm = await formRepository.update(
      { id: sealedForm.id },
      {
        status: transitionForm(sealedForm, {
          type: EventType.SignedByProducer,
          formUpdateInput
        }),
        ...formUpdateInput
      }
    );
    return expandFormFromDb(updatedForm);
  }

  return expandFormFromDb(sealedForm);
};

async function mailToNonExistentEmitter(
  form: Form,
  formRepository: FormRepository
) {
  // check contact email has not been mentionned already
  const contactAlreadyMentionned =
    (await formRepository.count({
      emitterCompanyMail: form.emitterCompanyMail,
      status: { not: Status.DRAFT }
    })) > 1;
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
