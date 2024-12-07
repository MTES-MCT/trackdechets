import {
  MutationSignBsdasriEmissionWithSecretCodeArgs,
  MutationResolvers,
  BsdasriSignatureType
} from "@td/codegen-back";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getBsdasriOrNotFound } from "../../database";
import { getAuthorizedOrgIds, signEmission } from "./signBsdasri";
import { checkCanSignFor } from "../../../permissions";
import { expandBsdasriFromDB } from "../../converter";

const signBsdasriEmissionWithSecretCode: MutationResolvers["signBsdasriEmissionWithSecretCode"] =
  async (
    _,
    { id, input }: MutationSignBsdasriEmissionWithSecretCodeArgs,
    context
  ) => {
    const user = checkIsAuthenticated(context);
    const existingBsdasri = await getBsdasriOrNotFound({
      id,
      includeAssociated: true
    });

    const signatureType: BsdasriSignatureType = "EMISSION";
    const signatureAuthor = input.signatureAuthor ?? "EMITTER";

    const authorizedSirets = getAuthorizedOrgIds(
      existingBsdasri,
      signatureType,
      signatureAuthor
    );

    await checkCanSignFor(
      user,
      signatureType,
      authorizedSirets,
      input.securityCode
    );

    const signedBsdasri = await signEmission(user, existingBsdasri, {
      ...input,
      type: signatureType,
      signatureAuthor
    });

    return expandBsdasriFromDB(signedBsdasri);
  };

export default signBsdasriEmissionWithSecretCode;
