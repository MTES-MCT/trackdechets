import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import { getBsdasriOrNotFound } from "../../database";
import { expandBsdasriFromDB } from "../../converter";
import { checkCanDeleteBsdasri } from "../../permissions";
import { getBsdasriRepository } from "../../repository";

/**
 *
 * Mark a dasri as deleted
 */
const deleteBsdasriResolver: MutationResolvers["deleteBsdasri"] = async (
  parent,
  { id },
  context
) => {
  const user = checkIsAuthenticated(context);

  const bsdasri = await getBsdasriOrNotFound({
    id
  });
  await checkCanDeleteBsdasri(user, bsdasri);

  const bsdasriRepository = getBsdasriRepository(user);

  const deletedBsdasri = await bsdasriRepository.delete({ id });

  return expandBsdasriFromDB(deletedBsdasri);
};

export default deleteBsdasriResolver;
