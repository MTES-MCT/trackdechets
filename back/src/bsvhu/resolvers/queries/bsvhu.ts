import { checkIsAuthenticated } from "../../../common/permissions";
import type { QueryBsvhuArgs } from "@td/codegen-back";
import { GraphQLContext } from "../../../types";
import { expandVhuFormFromDb } from "../../converter";
import { getBsvhuOrNotFound } from "../../database";
import { checkCanRead } from "../../permissions";

export default async function bsvhu(
  _,
  { id }: QueryBsvhuArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);

  const bsvhu = await getBsvhuOrNotFound(id);

  await checkCanRead(user, bsvhu);

  return expandVhuFormFromDb(bsvhu);
}
