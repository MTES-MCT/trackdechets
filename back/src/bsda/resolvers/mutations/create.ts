import { UserInputError } from "apollo-server-express";
import { checkIsAuthenticated } from "../../../common/permissions";
import getReadableId, { ReadableIdPrefix } from "../../../forms/readableId";
import {
  BsdaInput,
  MutationCreateBsdaArgs
} from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import { GraphQLContext } from "../../../types";
import { expandBsdaFromDb, flattenBsdaInput } from "../../converter";
import { getBsdaOrNotFound } from "../../database";
import { indexBsda } from "../../elastic";
import { checkIsBsdaContributor } from "../../permissions";
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

  const bsda = flattenBsdaInput(input);
  await checkIsBsdaContributor(
    user,
    bsda,
    "Vous ne pouvez pas créer un bordereau sur lequel votre entreprise n'apparait pas"
  );

  const isForwarding = Boolean(input.forwarding);
  const isGrouping = input.grouping?.length > 0;

  if ([isForwarding, isGrouping].filter(b => b).length > 1) {
    throw new UserInputError(
      "Les opérations d'entreposage provisoire et groupement ne sont pas compatibles entre elles"
    );
  }

  const forwardedBsda = isForwarding
    ? await getBsdaOrNotFound(input.forwarding)
    : null;
  const groupedBsdas = isGrouping
    ? await prisma.bsda.findMany({
        where: { id: { in: input.grouping } }
      })
    : [];

  const previousBsdas = [
    ...(isForwarding ? [forwardedBsda] : []),
    ...(isGrouping ? groupedBsdas : [])
  ];

  await validateBsda(bsda, previousBsdas, {
    isPrivateIndividual: bsda.emitterIsPrivateIndividual,
    isType2710: bsda.type === "COLLECTION_2710",
    emissionSignature: !isDraft
  });

  const newBsda = await prisma.bsda.create({
    data: {
      ...bsda,
      id: getReadableId(ReadableIdPrefix.BSDA),
      isDraft,
      ...(isForwarding && {
        forwarding: { connect: { id: input.forwarding } }
      }),
      ...(isGrouping && {
        grouping: { connect: groupedBsdas.map(({ id }) => ({ id })) }
      })
    }
  });

  await indexBsda(newBsda, context);

  return expandBsdaFromDb(newBsda);
}
