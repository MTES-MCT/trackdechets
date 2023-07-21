import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationUpdateBsdaArgs } from "../../../generated/graphql/types";
import { GraphQLContext } from "../../../types";
import {
  companyToIntermediaryInput,
  expandBsdaFromDb,
  flattenBsdaInput
} from "../../converter";
import { getBsdaOrNotFound } from "../../database";
import { checkEditionRules } from "../../validation/edition";
import { checkCanUpdate } from "../../permissions";
import { getBsdaRepository } from "../../repository";
import { parseBsda } from "../../validation/validate";
import { canBypassSirenify } from "../../../companies/sirenify";

const emptyWorkerData = {
  workerCompanyName: null,
  workerCompanySiret: null,
  workerCompanyAddress: null,
  workerCompanyContact: null,
  workerCompanyPhone: null,
  workerCompanyMail: null,
  workerCertificationHasSubSectionFour: false,
  workerCertificationHasSubSectionThree: false,
  workerCertificationCertificationNumber: null,
  workerCertificationValidityLimit: null,
  workerCertificationOrganisation: null
};

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

  await checkEditionRules(existingBsda, input, user);

  const flattenedInput = flattenBsdaInput(input);
  const unparsedBsda = {
    ...existingBsda,
    ...flattenedInput,
    intermediaries: input.intermediaries ?? existingBsda.intermediaries,
    grouping: input.grouping || existingBsda.grouping.map(bsda => bsda.id),
    forwarding: input.forwarding || existingBsda.forwarding?.id,
    ...(flattenedInput.workerIsDisabled ? emptyWorkerData : {})
  };

  const bsda = await parseBsda(unparsedBsda, {
    enableCompletionTransformers: !canBypassSirenify(user),
    enablePreviousBsdasChecks: true,
    currentSignatureType: getCurrentSignatureType(unparsedBsda)
  });

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

function getCurrentSignatureType(unparsedBsda) {
  // TODO calculate from SIGNATURES_HIERARCHY
  if (unparsedBsda.destinationOperationSignatureAuthor != null)
    return "OPERATION";
  if (unparsedBsda.transporterTransportSignatureAuthor != null)
    return "TRANSPORT";
  if (unparsedBsda.workerWorkSignatureAuthor != null) return "WORK";
  if (unparsedBsda.emitterEmissionSignatureAuthor != null) return "EMISSION";
  return undefined;
}
