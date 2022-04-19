import sign from "./sign";
import {
  MutationSignBsdasriEmissionWithSecretCodeArgs,
  MutationResolvers
} from "../../../generated/graphql/types";

const signBsdasriEmissionWithSecretCode: MutationResolvers["signBsdasriEmissionWithSecretCode"] =
  async (
    _,
    { id, input }: MutationSignBsdasriEmissionWithSecretCodeArgs,
    context
  ) => {
    const { securityCode, author } = input;
    return sign({
      id,
      author,
      context,
      securityCode
    });
  };

export default signBsdasriEmissionWithSecretCode;
