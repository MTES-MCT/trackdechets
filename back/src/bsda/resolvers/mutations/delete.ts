import { deleteBsd } from "../../../common/elastic";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationDeleteBsdaArgs } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import { expandBsdaFromDb } from "../../converter";
import { getBsdaOrNotFound } from "../../database";
import { checkCanDeleteBsda } from "../../permissions";
import { GraphQLContext } from "../../../types";

export default async function deleteBsda(
  _,
  { id }: MutationDeleteBsdaArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);

  const bsda = await getBsdaOrNotFound(id);
  await checkCanDeleteBsda(user, bsda);

  const deletedBsda = await prisma.bsda.update({
    where: { id },
    data: { isDeleted: true }
  });

  await deleteBsd(deletedBsda, context);

  return expandBsdaFromDb(deletedBsda);
}
