import { Bsda, BsdaStatus } from "@prisma/client";
import { checkIsAuthenticated } from "../../../common/permissions";
import getReadableId, { ReadableIdPrefix } from "../../../forms/readableId";
import { MutationDuplicateBsdaArgs } from "../../../generated/graphql/types";
import { expandBsdaFromDb } from "../../converter";
import { getBsdaOrNotFound } from "../../database";
import { checkIsBsdaContributor } from "../../permissions";
import { getBsdaRepository } from "../../repository";

export default async function duplicate(
  _,
  { id }: MutationDuplicateBsdaArgs,
  context
) {
  const user = checkIsAuthenticated(context);

  const prismaForm = await getBsdaOrNotFound(id);

  await checkIsBsdaContributor(
    user,
    prismaForm,
    "Vous ne pouvez pas modifier un bordereau sur lequel votre entreprise n'apparait pas"
  );

  const data = duplicateForm(prismaForm);
  const newBsda = await getBsdaRepository(user).create(data);

  return expandBsdaFromDb(newBsda);
}

function duplicateForm({
  id,
  createdAt,
  updatedAt,
  emitterEmissionSignatureAuthor,
  emitterEmissionSignatureDate,
  emitterCustomInfo,
  workerWorkHasEmitterPaperSignature,
  workerWorkSignatureAuthor,
  workerWorkSignatureDate,
  transporterTransportPlates,
  transporterCustomInfo,
  transporterTransportTakenOverAt,
  transporterTransportSignatureAuthor,
  transporterTransportSignatureDate,
  destinationCustomInfo,
  destinationReceptionWeight,
  destinationReceptionDate,
  destinationReceptionAcceptationStatus,
  destinationReceptionRefusalReason,
  destinationOperationCode,
  destinationOperationSignatureAuthor,
  destinationOperationSignatureDate,
  destinationOperationDate,
  wasteSealNumbers,
  forwardingId,
  groupedInId,
  ...rest
}: Bsda) {
  return {
    ...rest,
    id: getReadableId(ReadableIdPrefix.BSDA),
    status: BsdaStatus.INITIAL,
    isDraft: true
  };
}
