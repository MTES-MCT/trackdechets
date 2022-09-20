import sign from "./sign";
import {
  MutationSignBsdasriArgs,
  MutationResolvers
} from "../../../generated/graphql/types";
import { GraphQLContext } from "../../../types";

const signBsdasri: MutationResolvers["signBsdasri"] = async (
  _,
  { id, input }: MutationSignBsdasriArgs,
  context: GraphQLContext
) => {
  const { author, type } = input;
  return sign({ id, author, type, context });
};
export default signBsdasri;
