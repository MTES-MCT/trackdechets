import { MutationResolvers } from "../../../generated/graphql/types";
import { prisma } from "../../../generated/prisma-client";
import { checkIsAuthenticated } from "../../../common/permissions";
import { expandFormFromDb } from "../../form-converter";
import { checkCanDeleteForm } from "../../permissions";
import { getFormOrFormNotFound } from "../../database";

const deleteFormResolver: MutationResolvers["deleteForm"] = async (
  parent,
  { id },
  context
) => {
  const user = checkIsAuthenticated(context);

  const form = await getFormOrFormNotFound({ id });

  await checkCanDeleteForm(user, form);

  const deletedForm = await prisma.updateForm({
    where: { id },
    data: { isDeleted: true }
  });

  return expandFormFromDb(deletedForm);
};

export default deleteFormResolver;
