import { checkIsAuthenticated } from "../../../common/permissions";
import { getBsdasriOrNotFound } from "../../database";
import { expandBsdasriFromDB } from "../../converter";
import { UserInputError, ForbiddenError } from "apollo-server-express";
import { InvalidTransition } from "../../../forms/errors";
import prisma from "../../../../src/prisma";
import dasriTransition from "../../workflow/dasriTransition";
import {
  BsdasriType,
  BsdasriStatus,
  WasteAcceptationStatus
} from "@prisma/client";
import { checkIsCompanyMember } from "../../../users/permissions";
import { checkCanEditBsdasri } from "../../permissions";
import { getCachedUserSiretOrVat } from "../../../common/redis/users";
import { getBsdasriRepository } from "../../repository";

import {
  dasriSignatureMapping,
  checkDirectakeOverIsAllowed,
  checkEmissionSignedWithSecretCode,
  checkIsSignedByEcoOrganisme,
  getFieldsUpdate
} from "./signatureUtils";
import { indexBsdasri } from "../../elastic";
import { runInTransaction } from "../../../common/repository/helper";

const reindexAssociatedDasris = async dasriId => {
  const updatedDasris = await prisma.bsdasri.findMany({
    where: { synthesizedInId: dasriId }
    // no need to query grouping and synthesizing dasris for ES here
  });
  for (const updatedDasri of updatedDasris) {
    await indexBsdasri(updatedDasri);
  }
};
/**
 * When synthesized dasri is received or processed, associated dasris are updated
 *
 */
const cascadeOnSynthesized = async ({ dasri, bsdasriRepository }) => {
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
    await bsdasriRepository.updateMany(
      { synthesizedInId: dasri.id },
      {
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
        destinationReceptionSignatureDate,
        destinationReceptionAcceptationStatus: WasteAcceptationStatus.ACCEPTED
      }
    );
    await reindexAssociatedDasris(dasri.id);
  }

  if (dasri.status === BsdasriStatus.PROCESSED) {
    const {
      destinationOperationCode,
      destinationOperationDate,
      operationSignatoryId,
      destinationOperationSignatureDate,
      destinationOperationSignatureAuthor
    } = dasri;

    await bsdasriRepository.updateMany(
      { synthesizedInId: dasri.id },
      {
        status: BsdasriStatus.PROCESSED,
        destinationOperationCode,
        destinationOperationDate,
        operationSignatoryId,
        destinationOperationSignatureDate,
        destinationOperationSignatureAuthor
      }
    );
    await reindexAssociatedDasris(dasri.id);
  }
};

const getSiretWhoSigns = async ({
  authorizedSirets,
  userId
}: {
  authorizedSirets: string[];
  userId: string;
}): Promise<string> => {
  let siretWhoSigns;
  if (authorizedSirets.length === 1) {
    // One allowed siret ? let's use it
    [siretWhoSigns] = authorizedSirets;
    // Is this siret belonging to a current user ?
    await checkIsCompanyMember({ id: userId }, { siret: siretWhoSigns });
  } else {
    // several allowed sirets ? take the first belonging to current user
    const userCompaniesSiretOrVat = await getCachedUserSiretOrVat(userId);
    const userAuthorizedSirets = authorizedSirets.filter(siret =>
      userCompaniesSiretOrVat.includes(siret)
    );
    if (!userAuthorizedSirets.length) {
      throw new ForbiddenError(
        "Vous nêtes pas membre d'une entreprise autorisée"
      );
    }
    siretWhoSigns = userAuthorizedSirets[0];
  }
  return siretWhoSigns;
};
const sign = async ({
  id,
  author,
  type = null,
  securityCode = null,
  emissionSignatureAuthor = null,
  context
}) => {
  const user = checkIsAuthenticated(context);
  const bsdasri = await getBsdasriOrNotFound({ id, includeAssociated: true });

  checkCanEditBsdasri(bsdasri);

  if (bsdasri.isDraft) {
    throw new InvalidTransition();
  }

  const signatureType = type ?? "EMISSION_WITH_SECRET_CODE";

  const signatureParams = dasriSignatureMapping[signatureType];

  // Which siret is involved in current signature process ?
  const authorizedSirets = signatureParams.authorizedSirets(bsdasri);

  const siretWhoSigns = await getSiretWhoSigns({
    authorizedSirets,
    userId: user.id
  });

  const isSignedByEcoOrganisme = checkIsSignedByEcoOrganisme({
    signatureParams,
    siretWhoSigns,
    bsdasri
  });

  const isEmissionDirectTakenOver = await checkDirectakeOverIsAllowed({
    signatureParams,
    bsdasri
  });

  const isEmissionSignedWithSecretCode =
    await checkEmissionSignedWithSecretCode({
      signatureParams,
      bsdasri,
      securityCode,
      emissionSignatureAuthor
    });

  // handle synthesis special cases
  if (bsdasri.type === BsdasriType.SYNTHESIS) {
    if (!bsdasri.synthesizing?.length) {
      throw new UserInputError(
        "Un dasri de synthèse doit avoir des bordereaux associés"
      );
    }
    if (signatureType === "EMISSION")
      // we keep this code here i.o the state machine to return a customized error message
      throw new UserInputError(
        "Un dasri de synthèse INITIAL attend une signature transporteur, la signature producteur n'est pas acceptée."
      );
  }

  const data = {
    [signatureParams.author]: author,
    [signatureParams.date]: new Date(),
    [signatureParams.signatoryField]: { connect: { id: user.id } },
    ...getFieldsUpdate({ bsdasri, input: { author, type } })
  };

  const { where, updateData } = await dasriTransition(
    {
      ...bsdasri
    },
    {
      type: signatureParams.eventType,
      dasriUpdateInput: data
    },
    signatureParams.validationContext,
    {
      ...(isEmissionDirectTakenOver !== undefined
        ? { isEmissionDirectTakenOver }
        : {}),
      ...(isEmissionSignedWithSecretCode !== undefined
        ? {
            isEmissionTakenOverWithSecretCode: isEmissionSignedWithSecretCode,
            emittedByEcoOrganisme: emissionSignatureAuthor === "ECO_ORGANISME"
          }
        : {}),
      ...(isSignedByEcoOrganisme !== undefined
        ? { emittedByEcoOrganisme: isSignedByEcoOrganisme }
        : {})
    }
  );

  const signedDasri = await runInTransaction(async transaction => {
    const bsdasriRepository = getBsdasriRepository(user, transaction);

    const signedDasri = await bsdasriRepository.update(where, updateData);
    if (signedDasri.type === BsdasriType.SYNTHESIS) {
      await cascadeOnSynthesized({ dasri: signedDasri, bsdasriRepository });
    }
    return signedDasri;
  });

  return expandBsdasriFromDB(signedDasri);
};

export default sign;
