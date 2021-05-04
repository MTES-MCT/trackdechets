import sign from "./sign";
import {
  MutationSignBsdasriArgs,
  MutationResolvers
} from "../../../generated/graphql/types";

const signBsdasri: MutationResolvers["signBsdasri"] = async (
  _,
  { id, signatureInput }: MutationSignBsdasriArgs,
  context
) => {
  return sign({ id, signatureInput, context });
};
export default signBsdasri;
