import prisma from "../../../prisma";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import { getFormOrFormNotFound } from "../../database";
import { expandFormFromDb } from "../../form-converter";
import { checkCanMarkAsSealed } from "../../permissions";
import { checkCanBeSealed, checkDestinations } from "../../validation";
import transitionForm from "../../workflow/transitionForm";
import { EventType } from "../../workflow/types";

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

  // validate destinations
  await checkDestinations(form);

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

  return expandFormFromDb(sealedForm);
};

export default markAsSealedResolver;
