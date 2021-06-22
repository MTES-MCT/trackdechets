import { UserInputError } from "apollo-server-express";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import {
  flattenFicheInterventionBsffInput,
  unflattenFicheInterventionBsff
} from "../../converter";
import { ficheInterventionSchema } from "../../validation";
import {
  getBsffOrNotFound,
  getFicheInterventionBsffOrNotFound
} from "../../database";
import { isBsffContributor } from "../../permissions";

const updateFicheInterventionBsff: MutationResolvers["updateFicheInterventionBsff"] = async (
  _,
  { id, numero, input },
  context
) => {
  const user = checkIsAuthenticated(context);
  const bsff = await getBsffOrNotFound({ id });
  await isBsffContributor(user, bsff);

  if (bsff.emitterEmissionSignatureDate) {
    throw new UserInputError(
      `Il n'est pas possible d'éditer une fiche d'intervention après la signature de l'émetteur`
    );
  }

  const existingFicheIntervention = await getFicheInterventionBsffOrNotFound(
    id,
    numero
  );
  const ficheInterventionData = flattenFicheInterventionBsffInput(input);

  await ficheInterventionSchema.validate({
    ...existingFicheIntervention,
    ...ficheInterventionData
  });

  const updatedFicheIntervention = await prisma.bsffFicheIntervention.update({
    data: ficheInterventionData,
    where: { id: existingFicheIntervention.id }
  });

  return unflattenFicheInterventionBsff(updatedFicheIntervention);
};

export default updateFicheInterventionBsff;
