import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationDeleteBsdaArgs } from "../../../generated/graphql/types";
import { expandBsdaFromDb } from "../../converter";
import { getBsdaOrNotFound } from "../../database";
import { checkCanDeleteBsda } from "../../permissions";
import { GraphQLContext } from "../../../types";
import { getBsdaRepository, runInTransaction } from "../../repository";

export default async function deleteBsda(
  _,
  { id }: MutationDeleteBsdaArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);

  const bsda = await getBsdaOrNotFound(id);
  await checkCanDeleteBsda(user, bsda);

  return runInTransaction(async transaction => {
    const bsdaRepository = getBsdaRepository(user, transaction);

    const deletedBsda = await bsdaRepository.update(
      { id },
      { isDeleted: true, forwardingId: null }
    );

    await bsdaRepository.updateMany(
      { groupedInId: id },
      {
        groupedInId: null
      }
    );

    return expandBsdaFromDb(deletedBsda);
  });
}
