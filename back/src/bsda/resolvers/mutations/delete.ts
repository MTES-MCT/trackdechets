import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationDeleteBsdaArgs } from "@td/codegen-back";
import { expandBsdaFromDb } from "../../converter";
import { getBsdaOrNotFound } from "../../database";
import { GraphQLContext } from "../../../types";
import { getBsdaRepository } from "../../repository";
import { checkCanDelete } from "../../permissions";
import { getBsdaForElastic } from "../../elastic";

export default async function deleteBsda(
  _,
  { id }: MutationDeleteBsdaArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);

  const bsda = await getBsdaOrNotFound(id, {
    include: { intermediaries: true, transporters: true }
  });
  await checkCanDelete(user, bsda);

  const bsdaRepository = getBsdaRepository(user);
  const deletedBsda = await bsdaRepository.delete({ id });
  return expandBsdaFromDb(await getBsdaForElastic(deletedBsda));
}
