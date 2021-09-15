import { checkIsAuthenticated } from "../../../common/permissions";
import { getBsdasriOrNotFound } from "../../database";
import { unflattenBsdasri } from "../../converter";
import { InvalidTransition } from "../../../forms/errors";

import dasriTransition from "../../workflow/dasriTransition";

import { checkIsCompanyMember } from "../../../users/permissions";
import {
  dasriSignatureMapping,
  checkEmitterAllowsDirectTakeOver,
  checkEmitterAllowsSignatureWithSecretCode,
  getFieldsUpdate
} from "./signatureUtils";
import { indexBsdasri } from "../../elastic";
const basesign = async ({ id, input, context, securityCode = null }) => {
  const user = checkIsAuthenticated(context);
  const bsdasri = await getBsdasriOrNotFound({ id });
  if (bsdasri.isDraft) {
    throw new InvalidTransition();
  }
  const signatureType = securityCode ? "EMISSION_WITH_SECRET_CODE" : input.type;
  const signatureParams = dasriSignatureMapping[signatureType];

  // Which siret is involved in current signature process ?
  const siretWhoSigns = signatureParams.authorizedSiret(bsdasri);
  // Is this siret belonging to a concrete user ?
  await checkIsCompanyMember({ id: user.id }, { siret: siretWhoSigns });

  const isEmissionDirectTakenOver = await checkEmitterAllowsDirectTakeOver({
    signatureParams,
    bsdasri
  });

  const isEmissionTakenOverWithSecretCode = await checkEmitterAllowsSignatureWithSecretCode(
    {
      signatureParams,
      bsdasri,
      securityCode
    }
  );

  const data = {
    [signatureParams.author]: input.author,
    [signatureParams.date]: new Date(),
    [signatureParams.signatoryField]: { connect: { id: user.id } },
    ...getFieldsUpdate({ bsdasri, input })
  };

  const updatedDasri = await dasriTransition(
    {
      ...bsdasri
    },
    {
      type: signatureParams.eventType,
      dasriUpdateInput: data
    },
    signatureParams.validationContext,
    { isEmissionDirectTakenOver, isEmissionTakenOverWithSecretCode }
  );

  const expandedDasri = unflattenBsdasri(updatedDasri);
  await indexBsdasri(updatedDasri);
  return expandedDasri;
};

export default basesign;
