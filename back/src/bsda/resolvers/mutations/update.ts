import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationUpdateBsdaArgs } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import { GraphQLContext } from "../../../types";
import { SealedFieldsError } from "../../../vhu/errors";
import { expandBsdaFormFromDb, flattenBsdaInput } from "../../converter";
import { getFormOrFormNotFound } from "../../database";
import { checkIsFormContributor } from "../../permissions";
import { validateBsda } from "../../validation";

export default async function edit(
  _,
  { id, input }: MutationUpdateBsdaArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);

  const prismaForm = await getFormOrFormNotFound(id);
  await checkIsFormContributor(
    user,
    prismaForm,
    "Vous ne pouvez pas modifier un bordereau sur lequel votre entreprise n'apparait pas"
  );

  const invalidKeys = []; // TODO getNotEditableKeys(input, prismaForm);
  if (invalidKeys.length) {
    throw new SealedFieldsError(invalidKeys);
  }

  const formUpdate = flattenBsdaInput(input);

  const resultingForm = { ...prismaForm, ...formUpdate };
  await checkIsFormContributor(
    user,
    resultingForm,
    "Vous ne pouvez pas enlever votre établissement du bordereau"
  );

  await validateBsda(resultingForm, {
    emissionSignature: prismaForm.emitterEmissionSignatureAuthor != null,
    workSignature: prismaForm.workerWorkSignatureAuthor != null,
    operationSignature: prismaForm.destinationOperationSignatureAuthor != null,
    transportSignature: prismaForm.transporterTransportSignatureAuthor != null
  });

  const updatedForm = await prisma.bsda.update({
    where: { id },
    data: formUpdate
  });

  return expandBsdaFormFromDb(updatedForm);
}
