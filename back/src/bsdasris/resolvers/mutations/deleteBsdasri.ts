import prisma from "../../../prisma";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import * as elastic from "../../../common/elastic";
import { getBsdasriOrNotFound } from "../../database";
import { expandBsdasriFromDB } from "../../converter";
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

  const { grouping, synthesizing, ...bsdasri } = await getBsdasriOrNotFound({
    id,
    includeGrouped: true
  });
  // user must belong to the dasri, and status must be INITIAL
  // if this dasri is regrouped by an other, it should be in another status thus being not deletable
  // grouped Basdasri are RECEIVED and synthesized Bsdasri are SENT so they can't be deleted

  await checkCanDeleteBsdasri(user, bsdasri);
  // are any dasris grouped on the dasri we want to mark as deleted ?
  if (!!grouping.length) {
    // let's set their fk to null
    await prisma.bsdasri.updateMany({
      where: { id: { in: grouping.map(dasri => dasri.id) } },
      data: { groupedInId: null }
    });
  }
  if (!!synthesizing.length) {
    // let's set their fk to null
    await prisma.bsdasri.updateMany({
      where: { id: { in: synthesizing.map(dasri => dasri.id) } },
      data: { synthesizedInId: null }
    });
  }
  const deletedBsdasri = await prisma.bsdasri.update({
    where: { id },
    data: { isDeleted: true }
  });

  await elastic.deleteBsd(deletedBsdasri, context);

  return expandBsdasriFromDB(deletedBsdasri);
};

export default deleteBsdasriResolver;
