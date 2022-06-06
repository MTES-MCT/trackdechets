import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationDeleteBsdaArgs } from "../../../generated/graphql/types";
import { expandBsdaFromDb } from "../../converter";
import { getBsdaOrNotFound } from "../../database";
import { checkCanDeleteBsda } from "../../permissions";
import { GraphQLContext } from "../../../types";
import { getBsdaRepository } from "../../repository";

export default async function deleteBsda(
  _,
  { id }: MutationDeleteBsdaArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);

  const bsda = await getBsdaOrNotFound(id);
  await checkCanDeleteBsda(user, bsda);

  const bsdaRepository = getBsdaRepository(user);
  const deletedBsda = await bsdaRepository.delete({ id });
  return expandBsdaFromDb(deletedBsda);
}
