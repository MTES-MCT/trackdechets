import { UserInputError } from "../../../common/errors";
import type {
  MutationCreateBsdasriArgs,
  ResolversParentTypes
} from "@td/codegen-back";
import { GraphQLContext } from "../../../types";
import createBsdasri from "./createBsdasri";

const createDraftBsdasriResolver = async (
  _: ResolversParentTypes["Mutation"],
  args: MutationCreateBsdasriArgs,
  context: GraphQLContext
) => {
  if (args.input.synthesizing && args.input.synthesizing.length > 0) {
    throw new UserInputError(
      `La création de dasri de synthèse en brouillon n'est pas possible`
    );
  }
  return createBsdasri(args.input, context, true);
};

export default createDraftBsdasriResolver;
