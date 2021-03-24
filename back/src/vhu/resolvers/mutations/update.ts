import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationUpdateBsvhuArgs } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import { GraphQLContext } from "../../../types";
import { expandVhuFormFromDb, flattenVhuInput } from "../../converter";
import { getFormOrFormNotFound } from "../../database";
import { getNotEditableKeys } from "../../edition-rules";
import { SealedFieldsError } from "../../errors";
import { checkIsFormContributor } from "../../permissions";
import { validateBsvhuForm } from "../../validation";

export default async function edit(
  _,
  { id, input }: MutationUpdateBsvhuArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);

  const prismaForm = await getFormOrFormNotFound(id);
  await checkIsFormContributor(
    user,
    prismaForm,
    "Vous ne pouvez pas modifier un bordereau sur lequel votre entreprise n'apparait pas"
  );

  const invalidKeys = getNotEditableKeys(input, prismaForm);
  if (invalidKeys.length) {
    throw new SealedFieldsError(invalidKeys);
  }

  const formUpdate = flattenVhuInput(input);

  const resultingForm = { ...prismaForm, ...formUpdate };
  await checkIsFormContributor(
    user,
    resultingForm,
    "Vous ne pouvez pas enlever votre établissement du bordereau"
  );

  await validateBsvhuForm(resultingForm, {
    emitterSignature: prismaForm.emitterSignatureAuthor != null,
    recipientSignature: prismaForm.recipientSignatureAuthor != null,
    transporterSignature: prismaForm.transporterSignatureAuthor != null
  });

  const updatedForm = await prisma.bsvhuForm.update({
    where: { id },
    data: formUpdate
  });

  // TODO Status log ?
  // TODO emit event ?

  return expandVhuFormFromDb(updatedForm);
}
