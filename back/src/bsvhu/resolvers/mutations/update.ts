import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationUpdateBsvhuArgs } from "../../../generated/graphql/types";
import { GraphQLContext } from "../../../types";
import { expandVhuFormFromDb, flattenVhuInput } from "../../converter";
import { getBsvhuOrNotFound } from "../../database";
import { checkIsBsvhuContributor } from "../../permissions";
import { validateBsvhu } from "../../validation";
import { getBsvhuRepository } from "../../repository";
import { checkEditionRules } from "../../edition";

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

  const formUpdate = flattenVhuInput(input);

  const resultingForm = { ...prismaForm, ...formUpdate };
  await checkIsBsvhuContributor(
    user,
    resultingForm,
    "Vous ne pouvez pas enlever votre établissement du bordereau"
  );

  await checkEditionRules(prismaForm, input);

  await validateBsvhu(resultingForm, {
    emissionSignature: prismaForm.emitterEmissionSignatureAuthor != null,
    operationSignature: prismaForm.destinationOperationSignatureAuthor != null,
    transportSignature: prismaForm.transporterTransportSignatureAuthor != null
  });
  const bsvhuRepository = getBsvhuRepository(user);

  const updatedBsvhu = await bsvhuRepository.update({ id }, formUpdate);

  return expandVhuFormFromDb(updatedBsvhu);
}
