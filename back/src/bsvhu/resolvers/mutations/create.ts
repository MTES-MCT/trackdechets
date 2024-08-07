import { checkIsAuthenticated } from "../../../common/permissions";
import getReadableId, { ReadableIdPrefix } from "../../../forms/readableId";
import {
  BsvhuInput,
  MutationCreateBsvhuArgs
} from "../../../generated/graphql/types";

import { GraphQLContext } from "../../../types";
import { expandVhuFormFromDb } from "../../converter";
import { parseBsvhuAsync } from "../../validation";
import { getBsvhuRepository } from "../../repository";

import { checkCanCreate } from "../../permissions";
import { graphQlInputToZodBsvhu } from "../../validation/helpers";

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

  await checkCanCreate(user, input);

  const zodBsvhu = await graphQlInputToZodBsvhu(input);

  const { createdAt, ...parsedZodBsvhu } = await parseBsvhuAsync(
    { ...zodBsvhu, isDraft, createdAt: new Date() },
    {
      user,
      currentSignatureType: !isDraft ? "EMISSION" : undefined
    }
  );

  const bsvhuRepository = getBsvhuRepository(user);

  const newForm = await bsvhuRepository.create({
    ...parsedZodBsvhu,
    id: getReadableId(ReadableIdPrefix.VHU),
    isDraft
  });

  return expandVhuFormFromDb(newForm);
}
