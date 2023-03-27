import { UserInputError } from "apollo-server-express";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationUpdateBsdaArgs } from "../../../generated/graphql/types";
import { GraphQLContext } from "../../../types";
import {
  companyToIntermediaryInput,
  expandBsdaFromDb,
  flattenBsdaInput
} from "../../converter";
import { getBsdaOrNotFound } from "../../database";
import { checkEditionRules } from "../../edition";
import { checkIsBsdaContributor } from "../../permissions";
import { getBsdaRepository } from "../../repository";
import sirenify from "../../sirenify";
import { validateBsda } from "../../validation";

export default async function edit(
  _,
  { id, input }: MutationUpdateBsdaArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);
  const existingBsda = await getBsdaOrNotFound(id, {
    include: { intermediaries: true, grouping: true, forwarding: true }
  });
  await checkIsBsdaContributor(
    user,
    existingBsda,
    "Vous ne pouvez pas modifier un bordereau sur lequel votre entreprise n'apparait pas"
  );

  const sirenifiedInput = await sirenify(input, user);
  const data = flattenBsdaInput(sirenifiedInput);
  const intermediaries = input.intermediaries ?? existingBsda.intermediaries;

  await checkIsBsdaContributor(
    user,
    {
      ...existingBsda,
      ...data,
      intermediaries
    },
    "Vous ne pouvez pas enlever votre établissement du bordereau"
  );

  const bsdaRepository = getBsdaRepository(user);

  const forwardedBsda = input.forwarding
    ? await getBsdaOrNotFound(input.forwarding)
    : existingBsda.forwarding;

  const groupedBsdas =
    input.grouping?.length > 0
      ? await bsdaRepository.findMany({ id: { in: input.grouping } })
      : existingBsda.grouping;

  const isForwarding = Boolean(forwardedBsda);
  const isGrouping = groupedBsdas.length > 0;

  if ([isForwarding, isGrouping].filter(b => b).length > 1) {
    throw new UserInputError(
      "Les opérations d'entreposage provisoire et groupement ne sont pas compatibles entre elles"
    );
  }

  await checkEditionRules(existingBsda, input, user);

  const { grouping, forwarding, ...existingBsdaToValidate } = existingBsda;
  const resultingBsda = {
    ...existingBsdaToValidate,
    ...data
  };
  const previousBsdas = [forwardedBsda, ...groupedBsdas].filter(Boolean);
  await validateBsda(
    resultingBsda,
    { previousBsdas, intermediaries },
    {
      emissionSignature: existingBsda.emitterEmissionSignatureAuthor != null,
      workSignature: existingBsda.workerWorkSignatureAuthor != null,
      operationSignature:
        existingBsda.destinationOperationSignatureAuthor != null,
      transportSignature:
        existingBsda.transporterTransportSignatureAuthor != null
    }
  );

  const shouldUpdateIntermediaries = Array.isArray(input.intermediaries);

  const updatedBsda = await bsdaRepository.update(
    { id },
    {
      ...data,
      ...(input.grouping?.length > 0 && {
        grouping: { set: input.grouping.map(id => ({ id })) }
      }),
      ...(input.forwarding && {
        forwarding: { connect: { id: input.forwarding } }
      }),
      ...(shouldUpdateIntermediaries && {
        intermediariesOrgIds: input.intermediaries
          .flatMap(intermediary => [intermediary.siret, intermediary.vatNumber])
          .filter(Boolean),
        intermediaries: {
          deleteMany: {},
          createMany: { data: companyToIntermediaryInput(input.intermediaries) }
        }
      })
    }
  );

  return expandBsdaFromDb(updatedBsda);
}
