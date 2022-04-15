import {
  MutationCreateBsdasriArgs,
  ResolversParentTypes
} from "../../../generated/graphql/types";
import { GraphQLContext } from "../../../types";

import createBsdasri from "./createBsdasri";
import createSynthesisBsdasri from "./createSynthesisBsdasri";
import { UserInputError } from "apollo-server-express";

const createBsdasriResolver = async (
  _: ResolversParentTypes["Mutation"],
  args: MutationCreateBsdasriArgs,
  context: GraphQLContext
) => {
  const {
    input: { grouping, synthesizing }
  } = args;

  if (grouping && synthesizing) {
    throw new UserInputError(
      "Un bordereau dasri ne peut pas à la fois effectuer une opération de synthèse et de regroupement."
    );
  }

  if (synthesizing) {
    return createSynthesisBsdasri(args.input, context);
  }

  return createBsdasri(args.input, context, false);
};

export default createBsdasriResolver;
