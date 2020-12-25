import { checkIsAuthenticated } from "src/common/permissions";
import { MutationEditVhuFormArgs } from "src/generated/graphql/types";
import prisma from "src/prisma";
import { GraphQLContext } from "src/types";
import { expandVhuFormFromDb, flattenVhuInput } from "src/vhu/converter";
import { getFormOrFormNotFound } from "src/vhu/database";
import { getNotEditableKeys } from "src/vhu/edition-rules";
import { SealedFieldsError } from "src/vhu/errors";
import { checkIsFormContributor } from "src/vhu/permissions";
import { validateVhuForm } from "src/vhu/validation";

export default async function editVhuForm(
  _,
  { id, vhuFormInput }: MutationEditVhuFormArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);

  const prismaForm = await getFormOrFormNotFound(id);
  await checkIsFormContributor(
    user,
    prismaForm,
    "Vous ne pouvez pas modifier un bordereau sur lequel votre entreprise n'apparait pas"
  );

  const invalidKeys = getNotEditableKeys(vhuFormInput, prismaForm);
  if (invalidKeys.length) {
    throw new SealedFieldsError(invalidKeys);
  }

  const formUpdate = flattenVhuInput(vhuFormInput);

  const resultingForm = { ...prismaForm, ...formUpdate };
  await checkIsFormContributor(
    user,
    resultingForm,
    "Vous ne pouvez pas enlever votre établissement du bordereau"
  );

  await validateVhuForm(resultingForm, {
    emitterSignature: prismaForm.emitterSignatureId != null,
    recipientAcceptanceSignature:
      prismaForm.recipientAcceptanceSignatureId != null,
    recipientOperationSignature:
      prismaForm.recipientOperationSignatureId != null,
    transporterSignature: prismaForm.transporterSignatureId != null
  });

  const updatedForm = await prisma.vhuForm.update({
    where: { id },
    data: formUpdate
  });

  // TODO Status log ?
  // TODO emit event ?

  return expandVhuFormFromDb(updatedForm);
}
