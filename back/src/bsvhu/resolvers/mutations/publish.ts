import { ForbiddenError } from "apollo-server-express";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationPublishBsvhuArgs } from "../../../generated/graphql/types";
import { GraphQLContext } from "../../../types";
import { expandVhuFormFromDb } from "../../converter";
import { getBsvhuOrNotFound } from "../../database";
import { checkIsBsvhuContributor } from "../../permissions";
import { validateBsvhu } from "../../validation";
import { getBsvhuRepository } from "../../repository";

export default async function publish(
  _,
  { id }: MutationPublishBsvhuArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);

  const prismaForm = await getBsvhuOrNotFound(id);
  await checkIsBsvhuContributor(
    user,
    prismaForm,
    "Vous ne pouvez pas modifier un bordereau sur lequel votre entreprise n'apparait pas"
  );

  if (!prismaForm.isDraft) {
    throw new ForbiddenError(
      "Impossible de publier un bordereau qui n'est pas un brouillon"
    );
  }

  await validateBsvhu(prismaForm, { emissionSignature: true });
  const bsvhuRepository = getBsvhuRepository(user);

  const updatedBsvhu = await bsvhuRepository.update({ id }, { isDraft: false });

  return expandVhuFormFromDb(updatedBsvhu);
}
