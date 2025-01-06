import { checkIsAuthenticated } from "../../../common/permissions";
import type { MutationResolvers } from "@td/codegen-back";
import { getBspaohOrNotFound } from "../../database";
import { expandBspaohFromDb } from "../../converter";
import { getBspaohRepository } from "../../repository";
import { checkCanDelete } from "../../permissions";

/**
 *
 * Mark a bspaoh as deleted
 */
const deleteBspaohResolver: MutationResolvers["deleteBspaoh"] = async (
  parent,
  { id },
  context
) => {
  const user = checkIsAuthenticated(context);

  const bspaoh = await getBspaohOrNotFound({
    id
  });
  await checkCanDelete(user, bspaoh);
  const bspaohRepository = getBspaohRepository(user);
  const deletedBsdpaoh = await bspaohRepository.delete({ id });

  return expandBspaohFromDb(deletedBsdpaoh);
};

export default deleteBspaohResolver;
