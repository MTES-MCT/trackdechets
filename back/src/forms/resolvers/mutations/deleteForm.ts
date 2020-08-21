import { MutationResolvers } from "../../../generated/graphql/types";
import { prisma } from "../../../generated/prisma-client";
import { FormNotFound, NotFormContributor } from "../../errors";
import { checkIsAuthenticated } from "../../../common/permissions";
import { expandFormFromDb } from "../../form-converter";
import { isFormContributor } from "../../permissions";
import { getFullUser } from "../../../users/database";
import { getFormOrFormNotFound, getFullForm } from "../../database";
import { UserInputError } from "apollo-server-express";

const deleteFormResolver: MutationResolvers["deleteForm"] = async (
  parent,
  { id },
  context
) => {
  const user = checkIsAuthenticated(context);

  const form = await getFormOrFormNotFound({ id });

  if (form.status !== "DRAFT") {
    const errMessage =
      "Seuls les BSD à l'état de brouillon peuvent être supprimés";
    throw new UserInputError(errMessage);
  }

  const fullUser = await getFullUser(user);
  const fullForm = await getFullForm(form);
  if (!isFormContributor(fullUser, fullForm)) {
    throw new NotFormContributor();
  }

  const deletedForm = await prisma.updateForm({
    where: { id },
    data: { isDeleted: true }
  });

  return expandFormFromDb(deletedForm);
};

export default deleteFormResolver;
