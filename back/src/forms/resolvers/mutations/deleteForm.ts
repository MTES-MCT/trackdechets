import prisma from "src/prisma";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
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

  return expandFormFromDb(deletedForm);
};

export default deleteFormResolver;
