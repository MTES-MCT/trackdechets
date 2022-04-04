import sign from "./sign";
import {
  MutationSignBsdasriArgs,
  MutationResolvers
} from "@trackdechets/codegen/src/back.gen";

const signBsdasri: MutationResolvers["signBsdasri"] = async (
  _,
  { id, input }: MutationSignBsdasriArgs,
  context
) => {
  const { author, type } = input;
  return sign({ id, author, type, context });
};
export default signBsdasri;
