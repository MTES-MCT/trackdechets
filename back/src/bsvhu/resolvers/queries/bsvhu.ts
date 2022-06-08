import { checkIsAuthenticated } from "../../../common/permissions";
import { QueryBsvhuArgs } from "../../../generated/graphql/types";
import { GraphQLContext } from "../../../types";
import { expandVhuFormFromDb } from "../../converter";
import { getBsvhuOrNotFound } from "../../database";
import { checkIsBsvhuContributor } from "../../permissions";

export default async function bsvhu(
  _,
  { id }: QueryBsvhuArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);

  const form = await getBsvhuOrNotFound(id);
  await checkIsBsvhuContributor(
    user,
    form,
    "Vous n'êtes pas autorisé à accéder à ce bordereau"
  );

  return expandVhuFormFromDb(form);
}
