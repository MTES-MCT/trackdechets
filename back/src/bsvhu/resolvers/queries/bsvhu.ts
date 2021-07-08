import { checkIsAuthenticated } from "../../../common/permissions";
import { QueryBsvhuArgs } from "../../../generated/graphql/types";
import { GraphQLContext } from "../../../types";
import { expandVhuFormFromDb } from "../../converter";
import { getFormOrFormNotFound } from "../../database";
import { checkIsFormContributor } from "../../permissions";

export default async function bsvhu(
  _,
  { id }: QueryBsvhuArgs,
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
