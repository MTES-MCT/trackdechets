import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "@td/codegen-back";
import { getBsdasriOrNotFound } from "../../database";
import { expandBsdasriFromDB } from "../../converter";
import { validateBsdasri } from "../../validation";
import { getBsdasriRepository } from "../../repository";
import { checkCanUpdate, checkIsBsdasriPublishable } from "../../permissions";

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
  await checkCanUpdate(user, bsdasri);

  await checkIsBsdasriPublishable(
    bsdasri,
    grouping.map(el => el.id)
  );

  await validateBsdasri(bsdasri as any, { emissionSignature: true });

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
