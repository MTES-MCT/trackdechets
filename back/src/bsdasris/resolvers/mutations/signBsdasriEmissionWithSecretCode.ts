import type {
  MutationSignBsdasriEmissionWithSecretCodeArgs,
  MutationResolvers,
  BsdasriSignatureType
} from "@td/codegen-back";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getFullBsdasriOrNotFound } from "../../database";
import { getAuthorizedOrgIds, signEmission } from "./signBsdasri";
import { checkCanSignFor } from "../../../permissions";
import { expandBsdasriFromDB } from "../../converter";
import { parseBsdasriAsync } from "../../validation";
import { prismaToZodBsdasri } from "../../validation/helpers";

const signBsdasriEmissionWithSecretCode: MutationResolvers["signBsdasriEmissionWithSecretCode"] =
  async (
    _,
    { id, input }: MutationSignBsdasriEmissionWithSecretCodeArgs,
    context
  ) => {
    const user = checkIsAuthenticated(context);
    const existingBsdasri = await getFullBsdasriOrNotFound(id, {
      include: {
        grouping: true,
        synthesizing: true,
        intermediaries: true
      }
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

    const zodBsdasri = prismaToZodBsdasri(existingBsdasri);

    // Check that all necessary fields are filled
    await parseBsdasriAsync(
      { ...zodBsdasri },
      {
        user,
        currentSignatureType: signatureType
      }
    );

    const signedBsdasri = await signEmission(user, existingBsdasri, {
      ...input,
      type: signatureType,
      signatureAuthor
    });

    return expandBsdasriFromDB(signedBsdasri);
  };

export default signBsdasriEmissionWithSecretCode;
