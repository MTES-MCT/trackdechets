import sign from "./sign";
import {
  MutationSignBsdasriEmissionWithSecretCodeArgs,
  MutationResolvers
} from "../../../generated/graphql/types";

const signBsdasriEmissionWithSecretCode: MutationResolvers["signBsdasriEmissionWithSecretCode"] = async (
  _,
  { id, input }: MutationSignBsdasriEmissionWithSecretCodeArgs,
  context
) => {
  return sign({
    id,
    input,
    context,
    securityCode: input.securityCode
  });
};

export default signBsdasriEmissionWithSecretCode;
