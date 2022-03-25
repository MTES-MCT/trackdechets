import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import { getBsdasriOrNotFound } from "../../database";
import { expandBsdasriFromDB } from "../../converter";
import { validateBsdasri } from "../../validation";
import {
  checkIsBsdasriContributor,
  checkIsBsdasriPublishable,
  checkCanEditBsdasri
} from "../../permissions";
import prisma from "../../../prisma";
import { indexBsdasri } from "../../elastic";

const publishBsdasriResolver: MutationResolvers["publishBsdasri"] = async (
  _,
  { id },
  context
) => {
  const user = checkIsAuthenticated(context);

  const { grouping, synthesizing, ...bsdasri } = await getBsdasriOrNotFound({
    id,
    includeAssociated: true
  });

  checkCanEditBsdasri(bsdasri);

  await checkIsBsdasriContributor(
    user,
    bsdasri,
    "Vous ne pouvez publier ce bordereau si vous ne figurez pas dessus"
  );
  await checkIsBsdasriPublishable(
    bsdasri,
    grouping.map(el => el.id)
  );

  await validateBsdasri(bsdasri, { emissionSignature: true });

  // publish  dasri
  const publishedBsdasri = await prisma.bsdasri.update({
    where: { id: bsdasri.id },
    data: { isDraft: false }
  });

  const expandedDasri = expandBsdasriFromDB(publishedBsdasri);
  await indexBsdasri(publishedBsdasri);
  return expandedDasri;
};

export default publishBsdasriResolver;
