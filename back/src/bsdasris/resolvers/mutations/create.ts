import { UserInputError } from "../../../common/errors";
import type {
  MutationCreateBsdasriArgs,
  ResolversParentTypes
} from "@td/codegen-back";
import { GraphQLContext } from "../../../types";

import createBsdasri from "./createBsdasri";
import createSynthesisBsdasri from "./createSynthesisBsdasri";

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
