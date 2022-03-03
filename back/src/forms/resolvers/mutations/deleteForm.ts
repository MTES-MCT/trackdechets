import { Status } from "@prisma/client";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import { getFormOrFormNotFound } from "../../database";
import { expandFormFromDb } from "../../form-converter";
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
  const appendix2Forms = await formRepository.findAppendix2FormsById(id);
  const deletedForm = await formRepository.delete({ id });

  if (appendix2Forms.length) {
    // roll back status changes to appendixes 2
    await formRepository.updateMany(
      appendix2Forms.map(f => f.id),
      { status: Status.AWAITING_GROUP }
    );
  }

  return expandFormFromDb(deletedForm);
};

export default deleteFormResolver;
