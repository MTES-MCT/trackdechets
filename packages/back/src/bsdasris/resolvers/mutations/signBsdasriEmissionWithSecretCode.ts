import sign from "./sign";
import {
  MutationSignBsdasriEmissionWithSecretCodeArgs,
  MutationResolvers
} from "@trackdechets/codegen/src/back.gen";

const signBsdasriEmissionWithSecretCode: MutationResolvers["signBsdasriEmissionWithSecretCode"] =
  async (
    _,
    { id, input }: MutationSignBsdasriEmissionWithSecretCodeArgs,
    context
  ) => {
    const { securityCode, author, signatureAuthor = "EMITTER" } = input;
    return sign({
      id,
      author,
      context,
      securityCode,
      emissionSignatureAuthor: signatureAuthor
    });
  };

export default signBsdasriEmissionWithSecretCode;
