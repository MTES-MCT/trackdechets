import { MutationCreateBsvhuArgs } from "@trackdechets/codegen/src/back.gen";
import { GraphQLContext } from "../../../types";
import { genericCreate } from "./create";

export default async function createDraft(
  _,
  { input }: MutationCreateBsvhuArgs,
  context: GraphQLContext
) {
  return genericCreate({ isDraft: true, input, context });
}
