import { checkIsAuthenticated } from "../../../common/permissions";
import type { QueryBsdaArgs } from "@td/codegen-back";
import { GraphQLContext } from "../../../types";
import { expandBsdaFromDb } from "../../converter";
import { getBsdaOrNotFound } from "../../database";
import { checkCanRead } from "../../permissions";

export default async function bsda(
  _,
  { id }: QueryBsdaArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);

  const bsda = await getBsdaOrNotFound(id, { include: { transporters: true } });

  await checkCanRead(user, bsda);

  return expandBsdaFromDb(bsda);
}
