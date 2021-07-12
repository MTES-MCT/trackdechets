import {
  MutationCreateBsdasriArgs,
  ResolversParentTypes
} from "../../../generated/graphql/types";
import { GraphQLContext } from "../../../types";

import createBsdasri from "./create";

const createBsdasriResolver = async (
  parent: ResolversParentTypes["Mutation"],
  input: MutationCreateBsdasriArgs,
  context: GraphQLContext
) => {
  return createBsdasri(parent, input, context, false);
};

export default createBsdasriResolver;
