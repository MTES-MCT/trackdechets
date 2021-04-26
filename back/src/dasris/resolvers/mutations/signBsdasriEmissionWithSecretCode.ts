import sign from "./sign";
import {
  MutationSignBsdasriEmissionWithSecretCodeArgs,
  MutationResolvers
} from "../../../generated/graphql/types";

const signBsdasriEmissionWithSecretCode: MutationResolvers["signBsdasriEmissionWithSecretCode"] = async (
  _,
  { id, signatureInput }: MutationSignBsdasriEmissionWithSecretCodeArgs,
  context
) => {
  return sign({
    id,
    signatureInput,
    context,
    securityCode: signatureInput.securityCode
  });
};

export default signBsdasriEmissionWithSecretCode;
