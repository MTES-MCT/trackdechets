import { checkIsAuthenticated } from "../../../common/permissions";
import type { MutationResolvers } from "@td/codegen-back";
import { getBsvhuOrNotFound } from "../../database";
import { expandVhuFormFromDb } from "../../converter";
import { getBsvhuRepository } from "../../repository";
import { checkCanDelete } from "../../permissions";
import { BsvhuWithTransportersInclude } from "../../types";

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

  const bsvhu = await getBsvhuOrNotFound(id, {
    include: BsvhuWithTransportersInclude
  });
  // user must belong to the vhu, and status must be INITIAL

  await checkCanDelete(user, bsvhu);
  const bsvhuRepository = getBsvhuRepository(user);

  const deletedBsvhu = await bsvhuRepository.delete({ id });

  return expandVhuFormFromDb(deletedBsvhu);
};

export default deleteBsvhuResolver;
