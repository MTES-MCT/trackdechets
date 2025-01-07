import { checkIsAuthenticated } from "../../../common/permissions";
import type { MutationResolvers } from "@td/codegen-back";
import { getBsdasriOrNotFound } from "../../database";
import { expandBsdasriFromDB } from "../../converter";
import { getBsdasriRepository } from "../../repository";
import { checkCanDelete } from "../../permissions";

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
  await checkCanDelete(user, bsdasri);

  const bsdasriRepository = getBsdasriRepository(user);

  const deletedBsdasri = await bsdasriRepository.delete({ id });

  return expandBsdasriFromDB(deletedBsdasri);
};

export default deleteBsdasriResolver;
