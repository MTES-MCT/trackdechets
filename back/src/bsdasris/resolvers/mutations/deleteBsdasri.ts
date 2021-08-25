import prisma from "../../../prisma";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import * as elastic from "../../../common/elastic";
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

  const {
    regroupedBsdasris,
    synthesizedBsdasris,
    ...bsdasri
  } = await getBsdasriOrNotFound({
    id,
    includeRegrouped: true,
    includeSynthesized: true
  });
  // user must belong to the dasri, and status must be INITIAL
  // if this dasri is regrouped by an other, it should be in another status thus being not deletable
  await checkCanDeleteBsdasri(user, bsdasri);

  // are any dasris regrouped on the dasri we want to mark as deleted ?
  if (!!regroupedBsdasris.length) {
    // let's set their regroupedOnBsdasriId fk to null
    await prisma.bsdasri.updateMany({
      where: { id: { in: regroupedBsdasris.map(dasri => dasri.id) } },
      data: { regroupedOnBsdasriId: null }
    });
  }

  // are any dasris synthesized on the dasri we want to mark as deleted ?
  if (!!synthesizedBsdasris.length) {
    // let's set their synthesizedOnBsdasriId fk to null
    await prisma.bsdasri.updateMany({
      where: { id: { in: synthesizedBsdasris.map(dasri => dasri.id) } },
      data: { synthesizedOnBsdasriId: null }
    });
  }
  const deletedBsdasri = await prisma.bsdasri.update({
    where: { id },
    data: { isDeleted: true }
  });

  await elastic.deleteBsd(deletedBsdasri);

  return expandBsdasriFromDb(deletedBsdasri);
};

export default deleteBsdasriResolver;
