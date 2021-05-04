import {
  MutationCreateBsdasriArgs,
  ResolversParentTypes
} from "../../../generated/graphql/types";
import { GraphQLContext } from "../../../types";

import createBsdasri from "./create";

const createBsdasriResolver = async (
  parent: ResolversParentTypes["Mutation"],
  bsdasriCreateInput: MutationCreateBsdasriArgs,
  context: GraphQLContext
) => {
  return createBsdasri(parent, bsdasriCreateInput, context, false);
};

export default createBsdasriResolver;
