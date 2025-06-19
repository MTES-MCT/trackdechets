import { checkIsAuthenticated } from "../../../common/permissions";
import type { MutationResolvers } from "@td/codegen-back";
import { getFullBsdasriOrNotFound } from "../../database";
import { expandBsdasriFromDB } from "../../converter";
import { getBsdasriRepository } from "../../repository";
import { checkCanUpdate, checkIsBsdasriPublishable } from "../../permissions";
import { parseBsdasriAsync } from "../../validation";
import { prismaToZodBsdasri } from "../../validation/helpers";

const publishBsdasriResolver: MutationResolvers["publishBsdasri"] = async (
  _,
  { id },
  context
) => {
  const user = checkIsAuthenticated(context);

  const existingBsdasri = await getFullBsdasriOrNotFound(id, {
    include: {
      grouping: true,
      synthesizing: true,
      intermediaries: true
    }
  });

  await checkCanUpdate(user, existingBsdasri);

  await checkIsBsdasriPublishable(
    existingBsdasri,
    existingBsdasri.grouping.map(el => el.id)
  );

  await parseBsdasriAsync(
    { ...prismaToZodBsdasri(existingBsdasri) },
    {
      user,
      currentSignatureType: "EMISSION"
    }
  );

  const bsdasriRepository = getBsdasriRepository(user);

  // publish  dasri
  const publishedBsdasri = await bsdasriRepository.update(
    { id: existingBsdasri.id },
    { isDraft: false }
  );

  const expandedDasri = expandBsdasriFromDB(publishedBsdasri);

  return expandedDasri;
};

export default publishBsdasriResolver;
