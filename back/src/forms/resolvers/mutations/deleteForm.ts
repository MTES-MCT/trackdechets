import prisma from "../../../prisma";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import * as elastic from "../../../common/elastic";
import { getFormOrFormNotFound } from "../../database";
import { expandFormFromDb } from "../../form-converter";
import { checkCanDelete } from "../../permissions";

const deleteFormResolver: MutationResolvers["deleteForm"] = async (
  parent,
  { id },
  context
) => {
  const user = checkIsAuthenticated(context);

  const form = await getFormOrFormNotFound({ id });

  await checkCanDelete(user, form);

  const deletedForm = await prisma.form.update({
    where: { id },
    data: { isDeleted: true }
  });

  // TODO: create a statusLog

  await elastic.deleteBsd(deletedForm);

  return expandFormFromDb(deletedForm);
};

export default deleteFormResolver;
