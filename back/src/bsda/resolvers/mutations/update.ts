import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationUpdateBsdaArgs } from "../../../generated/graphql/types";
import { GraphQLContext } from "../../../types";
import { companyToIntermediaryInput, expandBsdaFromDb } from "../../converter";
import { getBsdaOrNotFound, getFirstTransporterSync } from "../../database";
import { checkCanUpdate } from "../../permissions";
import { getBsdaRepository } from "../../repository";
import { mergeInputAndParseBsdaAsync } from "../../validation";
import { Prisma } from "@prisma/client";

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

  const existingFirstTransporter = getFirstTransporterSync(existingBsda)!;

  await checkCanUpdate(user, existingBsda, input);

  const { parsedBsda: bsda, updatedFields } = await mergeInputAndParseBsdaAsync(
    existingBsda,
    input,
    {
      user,
      enableCompletionTransformers: true,
      enablePreviousBsdasChecks: true
    }
  );

  if (updatedFields.length === 0) {
    // Évite de faire un update "à blanc" si l'input
    // ne modifie pas les données. Cela permet de limiter
    // le nombre d'évenements crées dans Mongo.
    return expandBsdaFromDb(existingBsda);
  }

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

  let transporters:
    | Prisma.BsdaTransporterUpdateManyWithoutBsdaNestedInput
    | undefined = undefined;

  if (updatedFields.includes("transporters")) {
    if (input.transporter) {
      if (existingFirstTransporter) {
        // on met à jour le premier transporteur existant
        const { id, number, ...data } = bsda.transporters![0];
        transporters = { update: { where: { id: id! }, data } };
      } else {
        // on crée le premier transporteur
        const { id, ...data } = bsda.transporters![0];
        transporters = { create: { ...data, number: 1 } };
      }
    } else {
      // Cas où l'update est fait via `BsdaInput.transporters`. On déconnecte tous les transporteurs qui étaient
      // précédement associés et on connecte les nouveaux transporteurs de la table `BsdaTransporter`
      // avec ce bordereau. La fonction `update` du repository s'assure que la numérotation des
      // transporteurs correspond à l'ordre du tableau d'identifiants.
      transporters = {
        set: [],
        connect: bsda.transporters!.map(t => ({ id: t.id! }))
      };
    }
  }

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
