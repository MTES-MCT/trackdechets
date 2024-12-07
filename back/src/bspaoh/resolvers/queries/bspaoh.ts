import { checkIsAuthenticated } from "../../../common/permissions";
import { QueryBspaohArgs } from "@td/codegen-back";
import { GraphQLContext } from "../../../types";
import { expandBspaohFromDb } from "../../converter";
import { checkCanRead } from "../../permissions";
import { getBspaohOrNotFound } from "../../database";

export default async function bspaoh(
  _,
  { id }: QueryBspaohArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);

  const bspaoh = await getBspaohOrNotFound({ id });
  await checkCanRead(user, bspaoh);

  return expandBspaohFromDb(bspaoh);
}
