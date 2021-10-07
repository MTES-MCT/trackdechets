import { ForbiddenError } from "apollo-server-express";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationPublishBsdaArgs } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import { GraphQLContext } from "../../../types";
import { expandBsdaFromDb } from "../../converter";
import { getBsdaOrNotFound, getPreviousBsdas } from "../../database";
import { indexBsda } from "../../elastic";
import { checkIsBsdaContributor } from "../../permissions";
import { validateBsda } from "../../validation";

export default async function create(
  _,
  { id }: MutationPublishBsdaArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);

  const existingBsda = await getBsdaOrNotFound(id);
  await checkIsBsdaContributor(
    user,
    existingBsda,
    "Vous ne pouvez pas modifier un bordereau sur lequel votre entreprise n'apparait pas"
  );

  if (!existingBsda.isDraft) {
    throw new ForbiddenError(
      "Impossible de publier un bordereau qui n'est pas un brouillon"
    );
  }

  const previousBsdas = await getPreviousBsdas(existingBsda);
  await validateBsda(existingBsda, previousBsdas, { emissionSignature: true });

  const updatedBsda = await prisma.bsda.update({
    where: { id },
    data: { isDraft: false }
  });

  await indexBsda(updatedBsda, context);

  return expandBsdaFromDb(updatedBsda);
}
