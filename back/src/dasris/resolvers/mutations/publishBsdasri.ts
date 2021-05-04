import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import { getBsdasriOrNotFound } from "../../database";
import { expandBsdasriFromDb } from "../../dasri-converter";
import { validateBsdasri } from "../../validation";
import {
  checkIsBsdasriContributor,
  checkIsBsdasriPublishable
} from "../../permissions";
import prisma from "../../../prisma";

const publishBsdasriResolver: MutationResolvers["publishBsdasri"] = async (
  _,
  { id },
  context
) => {
  const user = checkIsAuthenticated(context);
  const bsdasri = await getBsdasriOrNotFound({ id });
  await checkIsBsdasriContributor(
    user,
    bsdasri,
    "Vous ne pouvez publier ce bordereau si vous ne figurez pas dessus"
  );
  await checkIsBsdasriPublishable(user, bsdasri);

  await validateBsdasri(bsdasri, { emissionSignature: true });
  // publish  dasri
  const publishedBsdasri = await prisma.bsdasri.update({
    where: { id: bsdasri.id },
    data: { isDraft: false }
  });
  return expandBsdasriFromDb(publishedBsdasri);
};

export default publishBsdasriResolver;
