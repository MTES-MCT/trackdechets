import { checkIsAuthenticated } from "../../../common/permissions";
import getReadableId, { ReadableIdPrefix } from "../../../forms/readableId";
import {
  BsdaInput,
  MutationCreateBsdaArgs
} from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import { GraphQLContext } from "../../../types";
import { expandBsdaFormFromDb, flattenBsdaInput } from "../../converter";
import { checkIsFormContributor } from "../../permissions";
import { validateBsda } from "../../validation";

type CreateBsda = {
  isDraft: boolean;
  input: BsdaInput;
  context: GraphQLContext;
};

export default async function create(
  _,
  { input }: MutationCreateBsdaArgs,
  context: GraphQLContext
) {
  return genericCreate({ isDraft: false, input, context });
}

export async function genericCreate({ isDraft, input, context }: CreateBsda) {
  const user = checkIsAuthenticated(context);

  const form = flattenBsdaInput(input);
  await checkIsFormContributor(
    user,
    form,
    "Vous ne pouvez pas créer un bordereau sur lequel votre entreprise n'apparait pas"
  );

  await validateBsda(form, { emissionSignature: !isDraft });

  // TODO regroupement / transfert

  const newForm = await prisma.bsda.create({
    data: { ...form, id: getReadableId(ReadableIdPrefix.BSDA), isDraft }
  });

  return expandBsdaFormFromDb(newForm);
}
