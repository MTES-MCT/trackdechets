import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import { getBsvhuOrNotFound } from "../../database";
import { expandVhuFormFromDb } from "../../converter";
import { getBsvhuRepository } from "../../repository";
import { checkCanDelete } from "../../permissions";

/**
 *
 * Mark a VHU as deleted
 */
const deleteBsvhuResolver: MutationResolvers["deleteBsvhu"] = async (
  _,
  { id },
  context
) => {
  const user = checkIsAuthenticated(context);

  const bsvhu = await getBsvhuOrNotFound(id);
  // user must belong to the vhu, and status must be INITIAL

  await checkCanDelete(user, bsvhu);
  const bsvhuRepository = getBsvhuRepository(user);

  const deletedBsvhu = await bsvhuRepository.delete({ id });

  return expandVhuFormFromDb(deletedBsvhu);
};

export default deleteBsvhuResolver;
