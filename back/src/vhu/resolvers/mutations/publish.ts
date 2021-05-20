import { ForbiddenError } from "apollo-server-express";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationPublishBsvhuArgs } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import { GraphQLContext } from "../../../types";
import { expandVhuFormFromDb } from "../../converter";
import { getFormOrFormNotFound } from "../../database";
import { checkIsFormContributor } from "../../permissions";
import { validateBsvhu } from "../../validation";
import { indexBsvhu } from "../../elastic";
export default async function create(
  _,
  { id }: MutationPublishBsvhuArgs,
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

  await validateBsvhu(prismaForm, { emissionSignature: true });

  const updatedForm = await prisma.bsvhu.update({
    where: { id },
    data: { isDraft: false }
  });
  await indexBsvhu(updatedForm);
  return expandVhuFormFromDb(updatedForm);
}
