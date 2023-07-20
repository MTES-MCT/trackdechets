import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationPublishBsvhuArgs } from "../../../generated/graphql/types";
import { GraphQLContext } from "../../../types";
import { expandVhuFormFromDb } from "../../converter";
import { getBsvhuOrNotFound } from "../../database";
import { validateBsvhu } from "../../validation";
import { getBsvhuRepository } from "../../repository";
import { checkCanUpdate } from "../../permissions";
import { ForbiddenError } from "../../../common/errors";

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

  await validateBsvhu(existingBsvhu, { emissionSignature: true });
  const bsvhuRepository = getBsvhuRepository(user);

  const updatedBsvhu = await bsvhuRepository.update({ id }, { isDraft: false });

  return expandVhuFormFromDb(updatedBsvhu);
}
