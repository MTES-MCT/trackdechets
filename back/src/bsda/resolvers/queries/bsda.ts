import { checkIsAuthenticated } from "../../../common/permissions";
import { QueryBsdaArgs } from "../../../generated/graphql/types";
import { GraphQLContext } from "../../../types";
import { expandBsdaFromDb } from "../../converter";
import { getFormOrFormNotFound } from "../../database";
import { checkIsFormContributor } from "../../permissions";

export default async function bsda(
  _,
  { id }: QueryBsdaArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);

  const form = await getFormOrFormNotFound(id);
  await checkIsFormContributor(
    user,
    form,
    "Vous n'êtes pas autorisé à accéder à ce bordereau"
  );

  return expandBsdaFromDb(form);
}
