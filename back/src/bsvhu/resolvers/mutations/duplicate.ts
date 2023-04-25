import { Prisma, BsvhuStatus } from "@prisma/client";
import { checkIsAuthenticated } from "../../../common/permissions";
import getReadableId, { ReadableIdPrefix } from "../../../forms/readableId";
import { MutationDuplicateBsvhuArgs } from "../../../generated/graphql/types";
import { expandVhuFormFromDb } from "../../converter";
import { getBsvhuOrNotFound } from "../../database";
import { getBsvhuRepository } from "../../repository";
import { checkCanDuplicate } from "../../permissions";

export default async function duplicate(
  _,
  { id }: MutationDuplicateBsvhuArgs,
  context
) {
  const user = checkIsAuthenticated(context);

  const prismaBsvhu = await getBsvhuOrNotFound(id);

  await checkCanDuplicate(user, prismaBsvhu);
  const bsvhuRepository = getBsvhuRepository(user);
  const newBsvhu = await bsvhuRepository.create(getDuplicateData(prismaBsvhu));

  return expandVhuFormFromDb(newBsvhu);
}

function getDuplicateData({
  id,
  createdAt,
  updatedAt,
  emitterEmissionSignatureAuthor,
  emitterEmissionSignatureDate,
  transporterTransportSignatureAuthor,
  transporterTransportSignatureDate,
  destinationReceptionQuantity,
  destinationReceptionWeight,
  destinationReceptionAcceptationStatus,
  destinationReceptionRefusalReason,
  destinationReceptionIdentificationNumbers,
  destinationReceptionIdentificationType,
  destinationReceptionDate,
  destinationOperationDate,
  destinationOperationCode,
  destinationOperationSignatureAuthor,
  destinationOperationSignatureDate,
  ...rest
}): Prisma.BsvhuCreateInput {
  return {
    ...rest,
    id: getReadableId(ReadableIdPrefix.VHU),
    status: BsvhuStatus.INITIAL,
    isDraft: true
  };
}
