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

import { getBsdasriRepository } from "../../repository";

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

  const bsdasriRepository = getBsdasriRepository(user);

  // publish  dasri
  const publishedBsdasri = await bsdasriRepository.update(
    { id: bsdasri.id },
    { isDraft: false }
  );

  const expandedDasri = expandBsdasriFromDB(publishedBsdasri);

  return expandedDasri;
};

export default publishBsdasriResolver;
