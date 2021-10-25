import { Bsdasri, BsdasriStatus, User } from "@prisma/client";
import { checkIsAuthenticated } from "../../../common/permissions";
import getReadableId, { ReadableIdPrefix } from "../../../forms/readableId";
import {
  MutationDuplicateBsdasriArgs,
  MutationResolvers
} from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import { unflattenBsdasri } from "../../converter";
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
  return unflattenBsdasri(newBsdasri);
};

function duplicateBsdasri(
  user: User,
  {
    id,
    createdAt,
    updatedAt,

    emissionSignatoryId,
    emitterEmissionSignatureDate,
    emitterEmissionSignatureAuthor,

    isEmissionDirectTakenOver,
    isEmissionTakenOverWithSecretCode,

    transporterAcceptationStatus,
    transporterWasteRefusalReason,
    transporterWasteRefusedWeightValue,
    transporterTakenOverAt,
    transporterWastePackagings,
    transporterWasteWeightValue,
    transporterWasteWeightIsEstimate,
    transporterWasteVolume,
    handedOverToRecipientAt,
    transportSignatoryId,
    transporterTransportSignatureDate,
    transporterTransportSignatureAuthor,

    destinationWastePackagings,
    destinationReceptionAcceptationStatus,
    destinationReceptionWasteRefusalReason,
    destinationReceptionWasteRefusedWeightValue,
    destinationReceptionWasteWeightValue,
    destinationReceptionWasteVolume,
    destinationReceptionDate,

    receptionSignatoryId,
    destinationReceptionSignatureDate,
    destinationReceptionSignatureAuthor,

    destinationOperationDate,

    operationSignatoryId,
    destinationOperationSignatureDate,
    destinationOperationSignatureAuthor,
    groupedInId,

    ...fieldsToCopy
  }: Bsdasri
) {
  return prisma.bsdasri.create({
    data: {
      ...fieldsToCopy,
      id: getReadableId(ReadableIdPrefix.DASRI),
      status: BsdasriStatus.INITIAL,
      isDraft: true
    }
  });
}

export default duplicateBsdasriResolver;
