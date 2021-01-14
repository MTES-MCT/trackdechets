import { VhuForm } from "@prisma/client";
import { checkIsAuthenticated } from "../../../common/permissions";
import getReadableId, { ReadableIdPrefix } from "../../../forms/readableId";
import { BordereauVhuMutationDuplicateArgs } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import { expandVhuFormFromDb } from "../../converter";
import { getFormOrFormNotFound } from "../../database";
import { checkIsFormContributor } from "../../permissions";

export default async function duplicate(
  _,
  { id }: BordereauVhuMutationDuplicateArgs,
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

  // TODO Status log ?
  // TODO emit event ?

  return expandVhuFormFromDb(newForm);
}

function duplicateForm({
  id,
  readableId,
  createdAt,
  updatedAt,
  emitterSignatureAuthor,
  emitterSignatureDate,
  transporterSignatureAuthor,
  transporterSignatureDate,
  recipientAcceptanceQuantity,
  recipientAcceptanceStatus,
  recipientAcceptanceRefusalReason,
  recipientOperationDone,
  recipientSignatureAuthor,
  recipientSignatureDate,
  ...rest
}: VhuForm) {
  return prisma.vhuForm.create({
    data: {
      ...rest,
      readableId: getReadableId(ReadableIdPrefix.VHU),
      status: "IN_PROGRESS",
      isDraft: true
    }
  });
}
