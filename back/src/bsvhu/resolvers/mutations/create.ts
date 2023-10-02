import { checkIsAuthenticated } from "../../../common/permissions";
import getReadableId, { ReadableIdPrefix } from "../../../forms/readableId";
import {
  BsvhuInput,
  MutationCreateBsvhuArgs
} from "../../../generated/graphql/types";

import { GraphQLContext } from "../../../types";
import { expandVhuFormFromDb, flattenVhuInput } from "../../converter";
import { validateBsvhu } from "../../validation";
import { getBsvhuRepository } from "../../repository";
import { sirenify } from "../../sirenify";
import { recipify } from "../../recipify";

import { checkCanCreate } from "../../permissions";

type CreateBsvhu = {
  isDraft: boolean;
  input: BsvhuInput;
  context: GraphQLContext;
};

export default async function create(
  _,
  { input }: MutationCreateBsvhuArgs,
  context: GraphQLContext
) {
  return genericCreate({ isDraft: false, input, context });
}

export async function genericCreate({ isDraft, input, context }: CreateBsvhu) {
  const user = checkIsAuthenticated(context);

  const sirenifiedInput = await sirenify(input, user);
  const autocompletedInput = await recipify(sirenifiedInput);

  await checkCanCreate(user, input);
  const form = flattenVhuInput(autocompletedInput);

  await validateBsvhu(form, { emissionSignature: !isDraft });
  const bsvhuRepository = getBsvhuRepository(user);

  const newForm = await bsvhuRepository.create({
    ...form,
    id: getReadableId(ReadableIdPrefix.VHU),
    isDraft
  });

  return expandVhuFormFromDb(newForm);
}
