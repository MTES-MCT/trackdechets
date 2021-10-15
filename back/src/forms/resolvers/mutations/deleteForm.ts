import prisma from "../../../prisma";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import * as elastic from "../../../common/elastic";
import { getFormOrFormNotFound } from "../../database";
import { expandFormFromDb } from "../../form-converter";
import { checkCanDelete } from "../../permissions";
import { Status } from ".prisma/client";

const deleteFormResolver: MutationResolvers["deleteForm"] = async (
  parent,
  { id },
  context
) => {
  const user = checkIsAuthenticated(context);

  const form = await getFormOrFormNotFound({ id });

  await checkCanDelete(user, form);

  const appendix2Forms = await prisma.form.findMany({
    where: { appendix2RootFormId: form.id }
  });

  const deletedForm = await prisma.form.update({
    where: { id },
    data: { isDeleted: true, appendix2Forms: { set: [] } }
  });

  if (appendix2Forms.length) {
    // roll back status changes to appendixes 2
    await prisma.form.updateMany({
      where: { id: { in: appendix2Forms.map(f => f.id) } },
      data: { status: Status.AWAITING_GROUP }
    });
  }

  // TODO: create a statusLog

  await elastic.deleteBsd(deletedForm, context);

  return expandFormFromDb(deletedForm);
};

export default deleteFormResolver;
