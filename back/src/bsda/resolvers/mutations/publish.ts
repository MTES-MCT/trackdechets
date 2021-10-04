import { ForbiddenError } from "apollo-server-express";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationPublishBsdaArgs } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import { GraphQLContext } from "../../../types";
import { expandBsdaFromDb } from "../../converter";
import { getFormOrFormNotFound } from "../../database";
import { indexBsda } from "../../elastic";
import { checkIsFormContributor } from "../../permissions";
import { validateBsda } from "../../validation";

export default async function create(
  _,
  { id }: MutationPublishBsdaArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);

  const prismaForm = await getFormOrFormNotFound(id);
  await checkIsFormContributor(
    user,
    prismaForm,
    "Vous ne pouvez pas modifier un bordereau sur lequel votre entreprise n'apparait pas"
  );

  if (!prismaForm.isDraft) {
    throw new ForbiddenError(
      "Impossible de publier un bordereau qui n'est pas un brouillon"
    );
  }

  await validateBsda(prismaForm, { emissionSignature: true });

  const updatedBsda = await prisma.bsda.update({
    where: { id },
    data: { isDraft: false }
  });

  await indexBsda(updatedBsda, context);

  return expandBsdaFromDb(updatedBsda);
}
