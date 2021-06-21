import sign from "./sign";
import {
  MutationSignBsdasriArgs,
  MutationResolvers
} from "../../../generated/graphql/types";

const signBsdasri: MutationResolvers["signBsdasri"] = async (
  _,
  { id, input }: MutationSignBsdasriArgs,
  context
) => {
  return sign({ id, input, context });
};
export default signBsdasri;
