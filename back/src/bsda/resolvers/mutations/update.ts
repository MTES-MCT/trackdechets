import { UserInputError } from "apollo-server-express";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationUpdateBsdaArgs } from "../../../generated/graphql/types";
import { GraphQLContext } from "../../../types";
import { expandBsdaFromDb, flattenBsdaInput } from "../../converter";
import { getBsdaOrNotFound } from "../../database";
import { checkKeysEditability } from "../../edition-rules";
import { checkIsBsdaContributor } from "../../permissions";
import { getBsdaRepository } from "../../repository";
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

  const data = flattenBsdaInput(input);

  const resultingForm = { ...existingBsda, ...data };
  await checkIsBsdaContributor(
    user,
    resultingForm,
    "Vous ne pouvez pas enlever votre établissement du bordereau"
  );

  const bsdaRepository = getBsdaRepository(user);

  const forwardedBsda = input.forwarding
    ? await getBsdaOrNotFound(input.forwarding)
    : existingBsda.forwardingId
    ? await bsdaRepository.findUnique({ id: existingBsda.forwardingId })
    : null;

  const groupedBsdas =
    input.grouping?.length > 0
      ? await bsdaRepository.findMany({ id: { in: input.grouping } })
      : await bsdaRepository
          .findRelatedEntity({ id: existingBsda.id })
          .grouping();

  const isForwarding = Boolean(forwardedBsda);
  const isGrouping = groupedBsdas.length > 0;

  if ([isForwarding, isGrouping].filter(b => b).length > 1) {
    throw new UserInputError(
      "Les opérations d'entreposage provisoire et groupement ne sont pas compatibles entre elles"
    );
  }

  checkKeysEditability(input, { ...existingBsda, grouping: groupedBsdas });

  const previousBsdas = [forwardedBsda, ...groupedBsdas].filter(Boolean);
  await validateBsda(resultingForm, previousBsdas, {
    emissionSignature: existingBsda.emitterEmissionSignatureAuthor != null,
    workSignature: existingBsda.workerWorkSignatureAuthor != null,
    operationSignature:
      existingBsda.destinationOperationSignatureAuthor != null,
    transportSignature: existingBsda.transporterTransportSignatureAuthor != null
  });

  const updatedBsda = await bsdaRepository.update(
    { id },
    {
      ...data,
      ...(input.grouping?.length > 0 && {
        grouping: { set: input.grouping.map(id => ({ id })) }
      }),
      ...(input.forwarding && {
        forwarding: { connect: { id: input.forwarding } }
      })
    }
  );

  return expandBsdaFromDb(updatedBsda);
}
