import { ForbiddenError } from "apollo-server-express";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationPublishBsvhuArgs } from "../../../generated/graphql/types";
import { GraphQLContext } from "../../../types";
import { expandVhuFormFromDb } from "../../converter";
import { getBsvhuOrNotFound } from "../../database";
import { validateBsvhu } from "../../validation";
import { getBsvhuRepository } from "../../repository";
import { checkCanUpdate } from "../../permissions";
import { getTransporterReceipt } from "../../../bsdasris/recipify";

export default async function publish(
  _,
  { id }: MutationPublishBsvhuArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);

  const existingBsvhu = await getBsvhuOrNotFound(id);

  await checkCanUpdate(user, existingBsvhu);

  if (!existingBsvhu.isDraft) {
    throw new ForbiddenError(
      "Impossible de publier un bordereau qui n'est pas un brouillon"
    );
  }
  const transporterReceipt = await getTransporterReceipt(existingBsvhu);
  await validateBsvhu(
    {
      ...existingBsvhu,
      ...transporterReceipt
    },
    { emissionSignature: true }
  );
  const bsvhuRepository = getBsvhuRepository(user);

  const updatedBsvhu = await bsvhuRepository.update(
    { id },
    { isDraft: false, ...transporterReceipt }
  );

  return expandVhuFormFromDb(updatedBsvhu);
}
