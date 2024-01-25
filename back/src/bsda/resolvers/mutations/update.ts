import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationUpdateBsdaArgs } from "../../../generated/graphql/types";
import { GraphQLContext } from "../../../types";
import { companyToIntermediaryInput, expandBsdaFromDb } from "../../converter";
import { getBsdaOrNotFound, getFirstTransporterSync } from "../../database";
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
    include: {
      intermediaries: true,
      grouping: true,
      forwarding: true,
      transporters: true
    }
  });

  // Un premier transporteur est initialisé dans la mutation `createBsda`
  // ce qui permet d'être certain que `transporter` est défini
  const existingTransporter = getFirstTransporterSync(existingBsda)!;

  await checkCanUpdate(user, existingBsda, input);

  const { bsda, transporter } = await parseBsdaInContext(
    { input, persisted: existingBsda },
    {
      enableCompletionTransformers: true,
      enablePreviousBsdasChecks: true,
      currentSignatureType: getCurrentSignatureType(existingBsda),
      user
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
  const intermediaries = bsda.intermediaries
    ? {
        deleteMany: {},
        ...(bsda.intermediaries.length > 0 && {
          createMany: {
            data: companyToIntermediaryInput(bsda.intermediaries)
          }
        })
      }
    : undefined;

  const transporters = {
    update: {
      where: { id: existingTransporter.id },
      data: transporter
    }
  };

  const bsdaRepository = getBsdaRepository(user);
  const updatedBsda = await bsdaRepository.update(
    { id },
    {
      ...bsda,
      forwarding,
      grouping,
      intermediaries,
      transporters
    }
  );

  return expandBsdaFromDb(updatedBsda);
}

function getCurrentSignatureType(bsda) {
  // TODO calculate from SIGNATURES_HIERARCHY
  if (bsda.destinationOperationSignatureDate != null) return "OPERATION";
  if (bsda.transporterTransportSignatureDate != null) return "TRANSPORT";
  if (bsda.workerWorkSignatureDate != null) return "WORK";
  if (bsda.emitterEmissionSignatureDate != null) return "EMISSION";
  return undefined;
}
