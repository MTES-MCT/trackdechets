import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationUpdateBsdaArgs } from "../../../generated/graphql/types";
import { GraphQLContext } from "../../../types";
import { companyToIntermediaryInput, expandBsdaFromDb } from "../../converter";
import { getBsdaOrNotFound, getFirstTransporterSync } from "../../database";
import { checkCanUpdate } from "../../permissions";
import { getBsdaRepository } from "../../repository";
import { mergeInputAndParseBsdaAsync } from "../../validation";

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

  const { bsda, transporter } = await mergeInputAndParseBsdaAsync(
    existingBsda,
    input,
    {
      user,
      enableCompletionTransformers: true,
      enablePreviousBsdasChecks: true
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

  const { id: transporterId, ...transporterData } = transporter;

  const transporters = {
    update: {
      where: { id: existingTransporter.id },
      data: transporterData
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
