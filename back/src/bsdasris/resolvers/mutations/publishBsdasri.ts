import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import { getBsdasriOrNotFound } from "../../database";
import { expandBsdasriFromDB } from "../../converter";
import { validateBsdasri } from "../../validation";
import { getBsdasriRepository } from "../../repository";
import { checkCanUpdate, checkIsBsdasriPublishable } from "../../permissions";
import { getTransporterReceipt } from "../../recipify";

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
  const transporterReceipt = await getTransporterReceipt(bsdasri);
  await validateBsdasri(
    {
      ...(bsdasri as any),
      ...transporterReceipt
    },
    { emissionSignature: true }
  );

  const bsdasriRepository = getBsdasriRepository(user);

  // publish  dasri
  const publishedBsdasri = await bsdasriRepository.update(
    { id: bsdasri.id },
    {
      isDraft: false,
      ...transporterReceipt
    }
  );

  const expandedDasri = expandBsdasriFromDB(publishedBsdasri);

  return expandedDasri;
};

export default publishBsdasriResolver;
