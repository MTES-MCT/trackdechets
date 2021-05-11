import prisma from "../../../prisma";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";

import { getBsdasriOrNotFound } from "../../database";
import { expandBsdasriFromDb } from "../../dasri-converter";
import { checkCanDeleteBsdasri } from "../../permissions";

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

  const { regroupedBsdasris, ...bsdasri } = await getBsdasriOrNotFound({
    id,
    includeRegrouped: true
  });
  // user must belong to the dasri, and status must be INITIAL
  // if this dasri is regrouped by an other, it should be in another status thus being not deletable
  await checkCanDeleteBsdasri(user, bsdasri);

  // are any dasris regrouped on the dasri we want to mark as deleted ?
  if (!!regroupedBsdasris.length) {
    // let's set their fk to null
    await prisma.bsdasri.updateMany({
      where: { id: { in: regroupedBsdasris.map(dasri => dasri.id) } },
      data: { regroupedOnBsdasriId: null }
    });
  }

  const deletedBsdasri = await prisma.bsdasri.update({
    where: { id },
    data: { isDeleted: true }
  });

  // TODO: update elasticsearch

  return expandBsdasriFromDb(deletedBsdasri);
};

export default deleteBsdasriResolver;
