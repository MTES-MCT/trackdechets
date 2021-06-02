import { Bsda, BsdaStatus } from "@prisma/client";
import { checkIsAuthenticated } from "../../../common/permissions";
import getReadableId, { ReadableIdPrefix } from "../../../forms/readableId";
import { MutationDuplicateBsdaArgs } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import { expandBsdaFromDb } from "../../converter";
import { getFormOrFormNotFound } from "../../database";
import { checkIsFormContributor } from "../../permissions";

export default async function duplicate(
  _,
  { id }: MutationDuplicateBsdaArgs,
  context
) {
  const user = checkIsAuthenticated(context);

  const prismaForm = await getFormOrFormNotFound(id);

  await checkIsFormContributor(
    user,
    prismaForm,
    "Vous ne pouvez pas modifier un bordereau sur lequel votre entreprise n'apparait pas"
  );

  const newForm = await duplicateForm(prismaForm);

  return expandBsdaFromDb(newForm);
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
  destinationReceptionQuantityType,
  destinationReceptionQuantityValue,
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
      id: getReadableId(ReadableIdPrefix.VHU),
      status: BsdaStatus.INITIAL,
      isDraft: true
    }
  });
}
