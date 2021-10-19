import { Bsvhu, BsvhuStatus } from "@prisma/client";
import { checkIsAuthenticated } from "../../../common/permissions";
import getReadableId, { ReadableIdPrefix } from "../../../forms/readableId";
import { MutationDuplicateBsvhuArgs } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import { expandVhuFormFromDb } from "../../converter";
import { getFormOrFormNotFound } from "../../database";
import { checkIsFormContributor } from "../../permissions";
import { indexBsvhu } from "../../elastic";
export default async function duplicate(
  _,
  { id }: MutationDuplicateBsvhuArgs,
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

  await indexBsvhu(newForm, context);
  return expandVhuFormFromDb(newForm);
}

function duplicateForm({
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
}: Bsvhu) {
  return prisma.bsvhu.create({
    data: {
      ...rest,
      id: getReadableId(ReadableIdPrefix.VHU),
      status: BsvhuStatus.INITIAL,
      isDraft: true
    }
  });
}
