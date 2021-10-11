import { Bsda, BsdaStatus } from "@prisma/client";
import { checkIsAuthenticated } from "../../../common/permissions";
import getReadableId, { ReadableIdPrefix } from "../../../forms/readableId";
import { MutationDuplicateBsdaArgs } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import { expandBsdaFromDb } from "../../converter";
import { getBsdaOrNotFound } from "../../database";
import { indexBsda } from "../../elastic";
import { checkIsBsdaContributor } from "../../permissions";

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

  const newBsda = await duplicateForm(prismaForm);
  await indexBsda(newBsda, context);

  return expandBsdaFromDb(newBsda);
}

function duplicateForm({
  id,
  createdAt,
  updatedAt,
  emitterEmissionSignatureAuthor,
  emitterEmissionSignatureDate,
  workerWorkSignatureAuthor,
  workerWorkSignatureDate,
  transporterTransportSignatureAuthor,
  transporterTransportSignatureDate,
  destinationReceptionWeight,
  destinationReceptionDate,
  destinationReceptionAcceptationStatus,
  destinationReceptionRefusalReason,
  destinationOperationCode,
  destinationOperationSignatureAuthor,
  destinationOperationSignatureDate,
  destinationOperationDate,
  ...rest
}: Bsda) {
  return prisma.bsda.create({
    data: {
      ...rest,
      id: getReadableId(ReadableIdPrefix.BSDA),
      status: BsdaStatus.INITIAL,
      isDraft: true
    }
  });
}
