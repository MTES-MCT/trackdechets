import { checkIsAuthenticated } from "src/common/permissions";
import { QueryVhuFormArgs } from "src/generated/graphql/types";
import { GraphQLContext } from "src/types";
import { expandVhuFormFromDb } from "src/vhu/converter";
import { getFormOrFormNotFound } from "src/vhu/database";
import { checkIsFormContributor } from "src/vhu/permissions";

export default async function vhuForm(
  _,
  { id }: QueryVhuFormArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);

  const form = await getFormOrFormNotFound(id);
  await checkIsFormContributor(
    user,
    form,
    "Vous n'êtes pas autorisé à accéder à ce bordereau"
  );

  return expandVhuFormFromDb(form);
}
