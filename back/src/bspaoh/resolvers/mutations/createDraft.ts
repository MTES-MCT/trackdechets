import type { MutationCreateBspaohArgs } from "@td/codegen-back";
import { GraphQLContext } from "../../../types";
import { genericCreate } from "./create";

export default async function createDraft(
  _,
  { input }: MutationCreateBspaohArgs,
  context: GraphQLContext
) {
  return genericCreate({ isDraft: true, input, context });
}
