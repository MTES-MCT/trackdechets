import {
  MutationCreateBsdasriArgs,
  ResolversParentTypes
} from "../../../generated/graphql/types";
import { GraphQLContext } from "../../../types";

import createBsdasri from "./create";

const createDraftBsdasriResolver = async (
  parent: ResolversParentTypes["Mutation"],
  input: MutationCreateBsdasriArgs,
  context: GraphQLContext
) => {
  return createBsdasri(parent, input, context, true);
};

export default createDraftBsdasriResolver;
