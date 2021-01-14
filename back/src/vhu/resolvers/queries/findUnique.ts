import { checkIsAuthenticated } from "../../../common/permissions";
import { BordereauVhuQueryFindUniqueArgs } from "../../../generated/graphql/types";
import { GraphQLContext } from "../../../types";
import { expandVhuFormFromDb } from "../../converter";
import { getFormOrFormNotFound } from "../../database";
import { checkIsFormContributor } from "../../permissions";

export default async function findUnique(
  _,
  { id }: BordereauVhuQueryFindUniqueArgs,
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
