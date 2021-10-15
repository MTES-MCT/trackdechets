import { checkIsAuthenticated } from "../../../common/permissions";
import getReadableId, { ReadableIdPrefix } from "../../../forms/readableId";
import {
  BsdaInput,
  MutationCreateBsdaArgs
} from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import { GraphQLContext } from "../../../types";
import { expandBsdaFromDb, flattenBsdaInput } from "../../converter";
import { indexBsda } from "../../elastic";
import {
  checkCanAssociateBsdas,
  checkIsBsdaContributor
} from "../../permissions";
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
  await checkIsBsdaContributor(
    user,
    form,
    "Vous ne pouvez pas créer un bordereau sur lequel votre entreprise n'apparait pas"
  );

  await validateBsda(form, {
    isPrivateIndividual: form.emitterIsPrivateIndividual,
    isType2710: form.type === "COLLECTION_2710",
    emissionSignature: !isDraft
  });

  await checkCanAssociateBsdas(input.associations);

  const newBsda = await prisma.bsda.create({
    data: {
      ...form,
      id: getReadableId(ReadableIdPrefix.BSDA),
      isDraft,
      bsdas: { connect: input.associations?.map(id => ({ id })) }
    }
  });

  await indexBsda(newBsda, context);

  return expandBsdaFromDb(newBsda);
}
