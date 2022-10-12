import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationUpdateBsvhuArgs } from "../../../generated/graphql/types";
import { GraphQLContext } from "../../../types";
import { expandVhuFormFromDb, flattenVhuInput } from "../../converter";
import { getBsvhuOrNotFound } from "../../database";
import { getNotEditableKeys } from "../../edition-rules";
import { SealedFieldsError } from "../../errors";
import { checkIsBsvhuContributor } from "../../permissions";
import { validateBsvhu } from "../../validation";
import { getBsvhuRepository } from "../../repository";

export default async function edit(
  _,
  { id, input }: MutationUpdateBsvhuArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);

  const prismaForm = await getBsvhuOrNotFound(id);
  await checkIsBsvhuContributor(
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
  await checkIsBsvhuContributor(
    user,
    resultingForm,
    "Vous ne pouvez pas enlever votre établissement du bordereau"
  );

  await validateBsvhu(resultingForm, {
    emissionSignature: prismaForm.emitterEmissionSignatureAuthor != null,
    operationSignature: prismaForm.destinationOperationSignatureAuthor != null,
    transportSignature: prismaForm.transporterTransportSignatureAuthor != null
  });
  const bsvhuRepository = getBsvhuRepository(user);

  const updatedBsvhu = await bsvhuRepository.update({ id }, formUpdate);

  return expandVhuFormFromDb(updatedBsvhu);
}
