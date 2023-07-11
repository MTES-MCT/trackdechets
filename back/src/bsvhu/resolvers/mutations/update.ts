import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationUpdateBsvhuArgs } from "../../../generated/graphql/types";
import { GraphQLContext } from "../../../types";
import { expandVhuFormFromDb, flattenVhuInput } from "../../converter";
import { getBsvhuOrNotFound } from "../../database";

import { validateBsvhu } from "../../validation";
import { getBsvhuRepository } from "../../repository";
import { checkEditionRules } from "../../edition";
import sirenify from "../../sirenify";
import { recipify } from "../../recipify";
import { checkCanUpdate } from "../../permissions";

export default async function edit(
  _,
  { id, input }: MutationUpdateBsvhuArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);

  const existingBsvhu = await getBsvhuOrNotFound(id);

  await checkCanUpdate(user, existingBsvhu, input);

  const sirenifiedInput = await sirenify(input, user);
  const autocompletedInput = await recipify(sirenifiedInput);

  const formUpdate = flattenVhuInput(autocompletedInput);

  const resultingForm = { ...existingBsvhu, ...formUpdate };

  await checkEditionRules(existingBsvhu, input, user);

  await validateBsvhu(resultingForm, {
    emissionSignature: existingBsvhu.emitterEmissionSignatureAuthor != null,
    operationSignature:
      existingBsvhu.destinationOperationSignatureAuthor != null,
    transportSignature:
      existingBsvhu.transporterTransportSignatureAuthor != null
  });
  const bsvhuRepository = getBsvhuRepository(user);

  const updatedBsvhu = await bsvhuRepository.update({ id }, formUpdate);

  return expandVhuFormFromDb(updatedBsvhu);
}
