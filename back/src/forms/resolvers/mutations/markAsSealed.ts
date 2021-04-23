import prisma from "../../../prisma";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import { getFormOrFormNotFound } from "../../database";
import { expandFormFromDb } from "../../form-converter";
import { checkCanMarkAsSealed } from "../../permissions";
import { checkCanBeSealed, checkCompaniesType } from "../../validation";
import transitionForm from "../../workflow/transitionForm";
import { EventType } from "../../workflow/types";
import { sendMail } from "../../../mailer/mailing";
import { renderMail } from "../../../mailer/templates/renderers";
import { contentAwaitsGuest } from "../../../mailer/templates";
import { Form, Status } from ".prisma/client";

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

  const sealedForm = await transitionForm(user, form, {
    type: EventType.MarkAsSealed
  });

  // mark appendix2Forms as GROUPED
  const appendix2Forms = await prisma.form
    .findUnique({ where: { id: form.id } })
    .appendix2Forms();
  if (appendix2Forms.length > 0) {
    const promises = appendix2Forms.map(appendix => {
      return transitionForm(user, appendix, {
        type: EventType.MarkAsGrouped
      });
    });
    await Promise.all(promises);
  }

  // send welcome email to emitter if it is not registered in TD
  const emitterCompanyExists =
    (await prisma.company.count({
      where: { siret: form.emitterCompanySiret }
    })) > 0;

  if (!emitterCompanyExists) {
    await mailToNonExistentEmitter(sealedForm);
  }

  return expandFormFromDb(sealedForm);
};

async function mailToNonExistentEmitter(form: Form) {
  // check contact email has not been mentionned already
  const contactAlreadyMentionned =
    (await prisma.form.count({
      where: {
        emitterCompanyMail: form.emitterCompanyMail,
        status: { not: Status.DRAFT }
      }
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
