import { Bsdasri, BsdasriStatus, User } from "@prisma/client";
import { checkIsAuthenticated } from "../../../common/permissions";
import getReadableId, { ReadableIdPrefix } from "../../../forms/readableId";
import {
  MutationDuplicateBsdasriArgs,
  MutationResolvers
} from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import { expandBsdasriFromDb } from "../../dasri-converter";
import { getBsdasriOrNotFound } from "../../database";
import { checkIsBsdasriContributor } from "../../permissions";
import { indexBsdasri } from "../../elastic";
/**
 *
 * Duplicate a bsdasri
 * Get rid of out a bunch of non duplicatable fields, including:
 *  - regroupment info
 *  - signatures
 *  - acceptation statuses and related fields
 *  - waste details info for transporter and recipient
 */
const duplicateBsdasriResolver: MutationResolvers["duplicateBsdasri"] = async (
  _,
  { id }: MutationDuplicateBsdasriArgs,
  context
) => {
  const user = checkIsAuthenticated(context);

  const bsdasri = await getBsdasriOrNotFound({
    id
  });

  await checkIsBsdasriContributor(
    user,
    bsdasri,
    "Vous ne pouvez pas modifier un bordereau sur lequel votre entreprise n'apparait pas."
  );

  const newBsdasri = await duplicateBsdasri(user, bsdasri);
  await indexBsdasri(newBsdasri);
  return expandBsdasriFromDb(newBsdasri);
};

function duplicateBsdasri(
  user: User,
  {
    id,
    createdAt,
    updatedAt,

    emissionSignatoryId,
    emissionSignatureDate,
    emissionSignatureAuthor,

    isEmissionDirectTakenOver,
    isEmissionTakenOverWithSecretCode,

    transporterWasteAcceptationStatus,
    transporterWasteRefusalReason,
    transporterWasteRefusedQuantity,
    transporterTakenOverAt,
    transporterWastePackagingsInfo,
    transporterWasteQuantity,
    transporterWasteQuantityType,
    transporterWasteVolume,
    handedOverToRecipientAt,

    transportSignatoryId,
    transportSignatureDate,
    transportSignatureAuthor,

    recipientWastePackagingsInfo,
    recipientWasteAcceptationStatus,
    recipientWasteRefusalReason,
    recipientWasteRefusedQuantity,
    recipientWasteQuantity,
    recipientWasteQuantityType,
    recipientWasteVolume,
    receivedAt,

    receptionSignatoryId,
    receptionSignatureDate,
    receptionSignatureAuthor,

    processedAt,

    operationSignatoryId,
    operationSignatureDate,
    operationSignatureAuthor,
    regroupedOnBsdasriId,
    ownerId,
    ...fieldsToCopy
  }: Bsdasri
) {
  return prisma.bsdasri.create({
    data: {
      ...fieldsToCopy,
      id: getReadableId(ReadableIdPrefix.DASRI),
      status: BsdasriStatus.INITIAL,
      isDraft: true,
      owner: { connect: { id: user.id } }
    }
  });
}

export default duplicateBsdasriResolver;
