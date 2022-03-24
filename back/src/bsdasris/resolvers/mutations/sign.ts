import { checkIsAuthenticated } from "../../../common/permissions";
import { getBsdasriOrNotFound } from "../../database";
import { expandBsdasriFromDB } from "../../converter";
import { UserInputError } from "apollo-server-express";
import { InvalidTransition } from "../../../forms/errors";
import prisma from "../../../../src/prisma";
import dasriTransition from "../../workflow/dasriTransition";
import { BsdasriType, BsdasriStatus } from "@prisma/client";
import { checkIsCompanyMember } from "../../../users/permissions";
import { checkCanEditBsdasri } from "../../permissions";
import {
  dasriSignatureMapping,
  checkEmitterAllowsDirectTakeOver,
  checkEmitterAllowsSignatureWithSecretCode,
  getFieldsUpdate
} from "./signatureUtils";
import { indexBsdasri } from "../../elastic";

/**
 * When synthesized dasri is received or processed, associated dasri are updated
 *
 */
const cascadeOnSynthesized = async ({ dasri }) => {
  if (dasri.status === BsdasriStatus.RECEIVED) {
    const {
      destinationCompanyName,
      destinationCompanySiret,
      destinationCompanyAddress,
      destinationCompanyContact,
      destinationCompanyPhone,
      destinationCompanyMail,
      destinationReceptionDate,
      receptionSignatoryId,
      destinationReceptionSignatureAuthor,
      destinationReceptionSignatureDate
    } = dasri;
    await prisma.bsdasri.updateMany({
      where: { synthesizedInId: dasri.id },
      data: {
        status: BsdasriStatus.RECEIVED,
        destinationCompanyName,
        destinationCompanySiret,
        destinationCompanyAddress,
        destinationCompanyContact,
        destinationCompanyPhone,
        destinationCompanyMail,
        destinationReceptionDate,
        receptionSignatoryId,
        destinationReceptionSignatureAuthor,
        destinationReceptionSignatureDate
      }
    });
    const updatedDasris = await prisma.bsdasri.findMany({
      where: { synthesizedInId: dasri.id }
    });
    for (const updatedDasri of updatedDasris) {
      const expandedDasri = expandBsdasriFromDB(updatedDasri);
      await indexBsdasri(expandedDasri);
    }
  }

  if (dasri.status === BsdasriStatus.PROCESSED) {
    const {
      destinationOperationCode,
      destinationOperationDate,
      operationSignatoryId,
      destinationOperationSignatureDate,
      destinationOperationSignatureAuthor
    } = dasri;

    await prisma.bsdasri.updateMany({
      where: { synthesizedInId: dasri.id },
      data: {
        status: BsdasriStatus.PROCESSED,
        destinationOperationCode,
        destinationOperationDate,
        operationSignatoryId,
        destinationOperationSignatureDate,
        destinationOperationSignatureAuthor
      }
    });
  }
};

const basesign = async ({ id, input, context, securityCode = null }) => {
  const user = checkIsAuthenticated(context);
  const bsdasri = await getBsdasriOrNotFound({ id, includeSynthesized: true });

  checkCanEditBsdasri(bsdasri);

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

  const isEmissionTakenOverWithSecretCode =
    await checkEmitterAllowsSignatureWithSecretCode({
      signatureParams,
      bsdasri,
      securityCode
    });

  if (bsdasri.type === BsdasriType.SYNTHESIS) {
    if (!bsdasri.synthesizing?.length) {
      throw new UserInputError(
        "Un dasri de synthèse doit avoir des bordereaux associés"
      );
    }
  }

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

  if (updatedDasri.type === BsdasriType.SYNTHESIS) {
    await cascadeOnSynthesized({ dasri: updatedDasri });
  }
  const expandedDasri = expandBsdasriFromDB(updatedDasri);
  await indexBsdasri(updatedDasri);
  return expandedDasri;
};

export default basesign;
