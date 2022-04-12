import {
  MutationCreateBsdasriArgs,
  ResolversParentTypes
} from "../../../generated/graphql/types";
import { GraphQLContext } from "../../../types";
import { UserInputError } from "apollo-server-express";
import createBsdasri from "./createBsdasri";

const createDraftBsdasriResolver = async (
  parent: ResolversParentTypes["Mutation"],
  args: MutationCreateBsdasriArgs,
  context: GraphQLContext
) => {
  if (args.input.synthesizing !== undefined) {
    throw new UserInputError(
      `La création de dasri de synthèse en brouillon n'est pas possible`
    );
  }
  return createBsdasri(args.input, context, true);
};

export default createDraftBsdasriResolver;
