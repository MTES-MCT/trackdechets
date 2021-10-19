import { UserInputError } from "apollo-server-express";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationUpdateBsdaArgs } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import { GraphQLContext } from "../../../types";
import { expandBsdaFromDb, flattenBsdaInput } from "../../converter";
import { getBsdaOrNotFound } from "../../database";
import { checkKeysEditability } from "../../edition-rules";
import { indexBsda } from "../../elastic";
import { checkIsBsdaContributor } from "../../permissions";
import { validateBsda } from "../../validation";

export default async function edit(
  _,
  { id, input }: MutationUpdateBsdaArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);

  const existingBsda = await getBsdaOrNotFound(id);
  await checkIsBsdaContributor(
    user,
    existingBsda,
    "Vous ne pouvez pas modifier un bordereau sur lequel votre entreprise n'apparait pas"
  );

  checkKeysEditability(input, existingBsda);

  const data = flattenBsdaInput(input);

  const resultingForm = { ...existingBsda, ...data };
  await checkIsBsdaContributor(
    user,
    resultingForm,
    "Vous ne pouvez pas enlever votre établissement du bordereau"
  );

  const forwardedBsda = input.forwarding
    ? await getBsdaOrNotFound(input.forwarding)
    : existingBsda.forwardingId
    ? await prisma.bsda.findUnique({ where: { id: existingBsda.forwardingId } })
    : null;

  const groupedBsdas =
    input.grouping?.length > 0
      ? await prisma.bsda.findMany({
          where: { id: { in: input.grouping } }
        })
      : await prisma.bsda
          .findUnique({ where: { id: existingBsda.id } })
          .grouping();

  const isForwarding = Boolean(forwardedBsda);
  const isGrouping = groupedBsdas.length > 0;

  if ([isForwarding, isGrouping].filter(b => b).length > 1) {
    throw new UserInputError(
      "Les opérations d'entreposage provisoire et groupement ne sont pas compatibles entre elles"
    );
  }

  const previousBsdas = [forwardedBsda, ...groupedBsdas].filter(Boolean);

  await validateBsda(resultingForm, previousBsdas, {
    emissionSignature: existingBsda.emitterEmissionSignatureAuthor != null,
    workSignature: existingBsda.workerWorkSignatureAuthor != null,
    operationSignature:
      existingBsda.destinationOperationSignatureAuthor != null,
    transportSignature: existingBsda.transporterTransportSignatureAuthor != null
  });

  const updatedBsda = await prisma.bsda.update({
    where: { id },
    data: {
      ...data,
      ...(isGrouping && {
        grouping: { set: input.grouping.map(id => ({ id })) }
      }),
      ...(isForwarding && {
        forwarding: { connect: { id: input.forwarding } }
      })
    }
  });

  await indexBsda(updatedBsda, context);

  return expandBsdaFromDb(updatedBsda);
}
