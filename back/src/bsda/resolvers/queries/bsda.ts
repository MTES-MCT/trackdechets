import { checkIsAuthenticated } from "../../../common/permissions";
import { QueryBsdaArgs } from "../../../generated/graphql/types";
import { GraphQLContext } from "../../../types";
import { expandBsdaFromDb } from "../../converter";
import { getBsdaOrNotFound } from "../../database";
import { checkIsBsdaContributor } from "../../permissions";

export default async function bsda(
  _,
  { id }: QueryBsdaArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);

  const form = await getBsdaOrNotFound(id);
  await checkIsBsdaContributor(
    user,
    form,
    "Vous n'êtes pas autorisé à accéder à ce bordereau"
  );

  return expandBsdaFromDb(form);
}
