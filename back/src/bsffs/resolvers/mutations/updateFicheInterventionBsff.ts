import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import {
  flattenFicheInterventionBsffInput,
  unflattenFicheInterventionBsff
} from "../../converter";
import { ficheInterventionSchema } from "../../validation";
import { getFicheInterventionBsffOrNotFound } from "../../database";
import { isFicheInterventionOperateur } from "../../permissions";

const updateFicheInterventionBsff: MutationResolvers["updateFicheInterventionBsff"] = async (
  _,
  { id, input },
  context
) => {
  const user = checkIsAuthenticated(context);
  const ficheInterventionData = flattenFicheInterventionBsffInput(input);

  const existingFicheIntervention = await getFicheInterventionBsffOrNotFound({
    id
  });
  await isFicheInterventionOperateur(user, existingFicheIntervention);

  const newFicheInterventionData = {
    ...existingFicheIntervention,
    ...ficheInterventionData
  };
  await isFicheInterventionOperateur(user, newFicheInterventionData);

  await ficheInterventionSchema.validate(newFicheInterventionData, {
    abortEarly: false
  });

  const updatedFicheIntervention = await prisma.bsffFicheIntervention.update({
    data: ficheInterventionData,
    where: { id: existingFicheIntervention.id }
  });

  return unflattenFicheInterventionBsff(updatedFicheIntervention);
};

export default updateFicheInterventionBsff;
