import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import { getFormOrFormNotFound } from "../../database";
import { getAndExpandFormFromDb } from "../../converter";
import { checkCanDelete } from "../../permissions";
import { getFormRepository } from "../../repository";

const deleteFormResolver: MutationResolvers["deleteForm"] = async (
  parent,
  { id },
  context
) => {
  const user = checkIsAuthenticated(context);

  const form = await getFormOrFormNotFound({ id });

  await checkCanDelete(user, form);

  const formRepository = getFormRepository(user);

  const deletedForm = await formRepository.delete({ id });

  return getAndExpandFormFromDb(deletedForm.id);
};

export default deleteFormResolver;
