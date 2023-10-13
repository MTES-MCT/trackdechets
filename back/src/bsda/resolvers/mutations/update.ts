import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationUpdateBsdaArgs } from "../../../generated/graphql/types";
import { GraphQLContext } from "../../../types";
import { companyToIntermediaryInput, expandBsdaFromDb } from "../../converter";
import { getBsdaOrNotFound } from "../../database";
import { checkCanUpdate } from "../../permissions";
import { getBsdaRepository } from "../../repository";
import { parseBsdaInContext } from "../../validation";

export default async function edit(
  _,
  { id, input }: MutationUpdateBsdaArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);
  const existingBsda = await getBsdaOrNotFound(id, {
    include: { intermediaries: true, grouping: true, forwarding: true }
  });

  await checkCanUpdate(user, existingBsda, input);

  const bsda = await parseBsdaInContext(
    { input, persisted: existingBsda },
    {
      enableCompletionTransformers: true,
      enablePreviousBsdasChecks: true,
      currentSignatureType: getCurrentSignatureType(existingBsda)
    }
  );

  const forwarding = !!bsda.forwarding
    ? { connect: { id: bsda.forwarding } }
    : bsda.forwarding === null
    ? { disconnect: true }
    : undefined;
  const grouping =
    bsda.grouping && bsda.grouping.length > 0
      ? { set: bsda.grouping.map(id => ({ id })) }
      : undefined;
  const intermediaries =
    bsda.intermediaries && bsda.intermediaries.length > 0
      ? {
          deleteMany: {},
          createMany: {
            data: companyToIntermediaryInput(bsda.intermediaries)
          }
        }
      : undefined;

  const bsdaRepository = getBsdaRepository(user);
  const updatedBsda = await bsdaRepository.update(
    { id },
    {
      ...bsda,
      forwarding,
      grouping,
      intermediaries
    }
  );

  return expandBsdaFromDb(updatedBsda);
}

function getCurrentSignatureType(bsda) {
  // TODO calculate from SIGNATURES_HIERARCHY
  if (bsda.destinationOperationSignatureAuthor != null) return "OPERATION";
  if (bsda.transporterTransportSignatureAuthor != null) return "TRANSPORT";
  if (bsda.workerWorkSignatureAuthor != null) return "WORK";
  if (bsda.emitterEmissionSignatureAuthor != null) return "EMISSION";
  return undefined;
}
